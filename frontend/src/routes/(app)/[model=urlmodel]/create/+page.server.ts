import { BASE_API_URL } from '$lib/utils/constants';
import {
	getModelInfo,
	urlParamModelForeignKeyFields,
	urlParamModelSelectFields,
	urlParamModelVerboseName
} from '$lib/utils/crud';
import { modelSchema } from '$lib/utils/schemas';
import { fail, type Actions } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import type { PageServerLoad } from './$types';
import type { ModelInfo } from '$lib/utils/types';
import { setFlash } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const URLModel = params.model!;
	const schema = modelSchema(params.model!);
	const form = await superValidate(schema);
	const model: ModelInfo = getModelInfo(params.model!);
	const foreignKeyFields = urlParamModelForeignKeyFields(params.model);
	const selectFields = urlParamModelSelectFields(params.model);

	const foreignKeys: Record<string, any> = {};

	for (const keyField of foreignKeyFields) {
		const queryParams = keyField.urlParams ? `?${keyField.urlParams}` : '';
		const url = `${BASE_API_URL}/${keyField.urlModel}/${queryParams}`;
		const response = await fetch(url);
		if (response.ok) {
			foreignKeys[keyField.field] = await response.json().then((data) => data.results);
		} else {
			console.error(`Failed to fetch data for ${keyField.field}: ${response.statusText}`);
		}
	}

	model['foreignKeys'] = foreignKeys;

	const selectOptions: Record<string, any> = {};

	for (const selectField of selectFields) {
		const url = `${BASE_API_URL}/${params.model}/${selectField.field}/`;
		const response = await fetch(url);
		if (response.ok) {
			selectOptions[selectField.field] = await response.json().then((data) =>
				Object.entries(data).map(([key, value]) => ({
					label: value,
					value: key
				}))
			);
		} else {
			console.error(`Failed to fetch data for ${selectField.field}: ${response.statusText}`);
		}
	}

	model['selectOptions'] = selectOptions;

	return { form, model, URLModel };
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const schema = modelSchema(event.params.model!);
		const createForm = await superValidate(formData, schema);

		const endpoint = `${BASE_API_URL}/${event.params.model}/`;

		if (!createForm.valid) {
			console.error(createForm.errors);
			return fail(400, { form: createForm });
		}

		if (formData) {
			const requestInitOptions: RequestInit = {
				method: 'POST',
				body: JSON.stringify(createForm.data)
			};
			const res = await event.fetch(endpoint, requestInitOptions);
			if (!res.ok) {
				const response = await res.json();
				console.error(response);
				if (response.warning) {
					setFlash({ type: 'warning', message: response.warning }, event);
					return { createForm };
				}
				if (response.error) {
					setFlash({ type: 'error', message: response.error }, event);
					return { createForm };
				}
				Object.entries(response).forEach(([key, value]) => {
					setError(createForm, key, value);
				});
				return fail(400, { form: createForm });
			}
			const createdObject = await res.json();

			if (formData.has('attachment')) {
				const { attachment } = Object.fromEntries(formData) as { attachment: File };
				if (attachment.size > 0) {
					const attachmentEndpoint = `${BASE_API_URL}/${event.params.model}/${createdObject.id}/upload/`;
					const attachmentRequestInitOptions: RequestInit = {
						headers: {
							'Content-Disposition': `attachment; filename=${encodeURIComponent(attachment.name)}`
						},
						method: 'POST',
						body: attachment
					};
					const attachmentRes = await event.fetch(attachmentEndpoint, attachmentRequestInitOptions);
					if (!attachmentRes.ok) {
						const response = await attachmentRes.json();
						console.error(response);
						if (response.non_field_errors) {
							setError(createForm, 'non_field_errors', response.non_field_errors);
						}
						return fail(400, { form: createForm });
					}
				}
			}

			const model: string = urlParamModelVerboseName(event.params.model!);
			// TODO: reference newly created object
			if (model === 'User') {
				return message(createForm, `${model} successfully created.`);
			}
			return message(createForm, `Successfully created ${model.toLowerCase()}.`);
		}
		return { createForm };
	}
};
