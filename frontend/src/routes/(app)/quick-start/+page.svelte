<script lang="ts">
	import { Step, Stepper } from '@skeletonlabs/skeleton';
	import CreateViewPage from '../[model=urlmodel]/create/+page.svelte';
	import LibraryDetailPage from '../libraries/[id=urn]/+page.svelte';
	import { goto, preloadData, pushState } from '$app/navigation';
	import { page } from '$app/stores';
	import type { ComponentType } from 'svelte';

	interface Journey {
		name: string;
		description: string;
		steps: Step[];
	}

	interface Step {
		name: string;
		description: string;
		url: string;
		component: ComponentType;
	}

	const journeys: Record<string, Journey> = {
		quickStart: {
			name: 'Quick Start',
			description: 'Get started with CISO Assistant',
			steps: [
				// {
				// 	name: 'Import a risk matrix',
				// 	description: 'Import a risk matrix to get started',
				// 	url: '/libraries/urn:intuitem:risk:library:critical_risk_matrix_5x5',
				// 	component: LibraryDetailPage
				// },
				{
					name: 'Create a domain',
					description: 'Create a domain to get started',
					url: '/folders/create',
					component: CreateViewPage
				},
				{
					name: 'Create a project',
					description: 'Create a project to get started',
					url: '/projects/create',
					component: CreateViewPage
				},
				{
					name: 'Create a risk assessment',
					description: 'Create a risk or compliance assessment to get started',
					url: '/risk-assessments/create',
					component: CreateViewPage
				},
				{
					name: 'Create a risk scenario',
					description: 'Create a risk scenario to get started',
					url: '/risk-scenarios/create',
					component: CreateViewPage
				},
				{
					name: 'Assess a risk scenario',
					description: 'Assess a risk to get started',
					url: '/risk-scenarios',
					component: CreateViewPage
				}
			]
		}
	};

	async function onStep(e: CustomEvent) {
		console.log('onStep', e);
		const currentStep: number = e.detail.state.current;
		// const totalSteps: number = e.detail.state.total;
		const step: Step = steps[currentStep - 1];
		console.log('step', step);
		const result = await preloadData(step.url);
		if (result.type === 'loaded' && result.status === 200) {
			pushState($page.url.href, { data: result.data });
		}
	}

	const steps = journeys.quickStart.steps;
</script>

<div class="card bg-white p-4 shadow">
	<Stepper on:step={onStep}>
		<Step>
			<svelte:fragment slot="header">Quick start</svelte:fragment>
		</Step>
		{#each steps as step}
			<Step>
				<svelte:fragment slot="header">{step.name}</svelte:fragment>
				{step.description}
				{#if $page.state.data}
					<svelte:component this={step.component} data={$page.state.data} />
				{/if}
			</Step>
		{/each}
	</Stepper>
</div>
