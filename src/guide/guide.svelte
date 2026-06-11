<div class="h-full flex items-stretch">
	<div class="pt-4 px-2 flex flex-col gap-1 border-r">
		{#each tabs as t, i}
			{#if !t.hidden}
				<button class={[i == selected && "active", "h-auto"]} style="line-height: 1.2; padding: 0.3rem 0;" onclick={() => handleClick(i)}>{t.name}</button>
			{/if}
		{/each}
	</div>
	<div class="w-full relative">
		<div class="overflow-y-scroll h-full pb-16 select-text">
			<Content />
		</div>
		{#if store.dirty}
			<div class="absolute bottom-2 left-1/2 -translate-x-1/2 py-1 px-4 rounded-xl border-2 bg-gray-200 dark:bg-gray-800" transition:slide={{ duration: 200 }}>
				<div class="flex gap-2 items-center">
					<span>저장되지 않은 변경 사항</span>
					<button class="w-auto!" onclick={() => store.commit()}>저장</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<script lang="ts">
import { fly, slide } from "svelte/transition"
import Delay from "./content/delay.svelte"
import Emanation from "./content/emanation.svelte"
import Flat from "./content/flat.svelte"
import HpTransfer from "./content/hp-transfer.svelte"
import Intro from "./content/intro.svelte"
import Misc from "./content/misc.svelte"
import { getStore } from "./setting.svelte"

const tabs = [
	{ name: "소개", content: Intro, hidden: true },
	{ name: "단순 판정", content: Flat },
	{ name: "지연", content: Delay },
	{ name: "HP 이전", content: HpTransfer },
	{ name: "발산 자동화", content: Emanation },
	{ name: "기타", content: Misc },
]
let selected = $state(0)
const Content = $derived(tabs[selected].content)

function handleClick(index: number) {
	selected = index
}

const store = getStore()
</script>

<style>
	button.active {
		background: var(--button-hover-background-color);
	}
</style>
