<script lang="ts">
	import ModelForm from '$lib/components/Forms/ModelForm.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const { form, model } = data;
</script>

<ModelForm {form} {model} />
