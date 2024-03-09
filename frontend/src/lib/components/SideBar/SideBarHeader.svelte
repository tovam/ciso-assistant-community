<script lang="ts">
	import { goto, preloadData, pushState } from '$app/navigation';
	import { page } from '$app/stores';
	import ciso from '$lib/assets/ciso.svg';

	import QuickStartPage from '../../../routes/(app)/quick-start/+page.svelte';

	const modalStore = getModalStore();

	async function onHeaderClick(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		if (e.metaKey || e.ctrlKey) return;
		e.preventDefault();

		const { href } = e.currentTarget;

		const result = await preloadData(href);

		console.log('result', result);

		if (result.type === 'loaded' && result.status === 200) {
			pushState(href, {});
		} else {
			goto(href);
		}
		const modalComponent: ModalComponent = {
			ref: QuickStartPage,
			props: { data: result.data }
		};
		const modal: ModalSettings = {
			type: 'component',
			// Data
			title: 'Example Alert',
			// Options
			component: modalComponent
		};

		modalStore.trigger(modal);
	}

	import { getModalStore, type ModalComponent, type ModalSettings } from '@skeletonlabs/skeleton';
</script>

<header class="h-32">
	<a
		href="/quick-start"
		on:click={onHeaderClick}
		class="flex flex-row space-x-4 border-b pb-3 items-center justify-center"
	>
		<img
			class="c cursor-pointer hover:drop-shadow-[0_1px_2px_rgba(79,70,229,0.5)]"
			height="200"
			width="200"
			src={ciso}
			alt="Ciso-assistant icon"
		/>
	</a>
</header>
