<div class="flex items-center">
	<strong>{label}</strong>

	{#if missingLibwrapper}
	<i class="fa-solid fa-cube mx-1 text-red-700" use:tooltip={{text: "lib-wrapper 필요"}}></i>
	{:else if locked}
	<i class="fa-solid fa-lock mx-1 text-orange-500" use:tooltip={{text: "이 월드에서 클라이언트 설정을 제어하는 모듈이 활성화되어 있습니다.\n이 설정을 변경하려면 코어 설정 창을 사용해 주세요."}}></i>
	{:else if setting.type === Boolean}
		<input type="checkbox" class={[disabled && "cursor-not-allowed!"]} disabled={disabled} bind:checked={
			() => invert ? !value : value,
			(v) => store.setValue(key, invert ? !v : v)
		}>
	{:else if setting.type === String && setting.choices}
		<select class={[disabled && "cursor-not-allowed!", "w-auto!", "mx-1"]} disabled={disabled} bind:value={
			() => value,
			(v) => store.setValue(key, v)
		}>
			{#each Object.entries(setting.choices) as [k, v]}
				<option value="{k}">{translate(v as string)}</option>
			{/each}
		</select>
	{:else}
		<span>{JSON.stringify(value)}</span>
	{/if}

	<div use:tooltip={{text: tooltipText}}>
		<i class="fa-solid {icon}"></i>
	</div>
	{#if requiresReload}
		<div class="ml-1" use:tooltip={{text: "재시작 필요"}}>
			<i class="fa-solid fa-rotate-right"></i>
		</div>
	{/if}
</div>

<script lang="ts">
import MODULE from "src"
import { MODULE_ID } from "src/constants"
import { translate } from "src/utils"
import { getStore } from "../../setting.svelte"
import { tooltip } from "./tooltip.svelte"

interface Props {
	label: string
	key: string
	invert?: boolean
}
const { label, key, invert }: Props = $props()

const setting = game.settings.settings.get(`${MODULE_ID}.${key}`)!
let icon = "fas fa-earth"
let tooltipText = "월드 설정"
if (setting.scope === "client") {
	icon = "fas fa-browser"
	tooltipText = "클라이언트 설정: 이 설정 변경은 이 브라우저에서 본인에게만 적용됩니다."
} else if ((setting.scope as string) === "user") {
	icon = "fas fa-user"
	tooltipText = "사용자 설정: 이 설정 변경은 본인에게만 적용됩니다."
}
const requiresReload = setting.requiresReload

const missingLibwrapper =
	MODULE.settings.flags.get(key)?.requiresLibwrapper && !game.modules.get("lib-wrapper")?.active
const disabled = setting.scope === "world" && !game.user.isGM
const locked = setting.scope === "client" && game.modules.get("force-client-settings")?.active

const store = getStore()
const value = $derived.by(() => {
	const uncommited = store.uncommitted.get(key)
	return uncommited === undefined ? store.current.get(key) : uncommited
})
</script>

<style>
	input[type="checkbox"]:indeterminate::before {
		content: "\f146";
		color: var(--color-level-error);
	}

</style>
