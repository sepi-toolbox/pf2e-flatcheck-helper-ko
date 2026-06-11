<h3 class="ml-4">단순 판정</h3>

<main>
	<SettingSection>
		<img src="{FlatInMessage}">
		<div class="justify-self-start">
			<h5>메시지의 단순 판정</h5>
			<p>
				타격, 주문 및 기타 채팅 메시지에 단순 판정을 추가합니다.
			</p>
			<SettingInput key="flat-check-in-message" label="활성화" />

			<h5>단순 판정 자동 굴림</h5>
			<SettingInput key="flat-check-auto-roll" label="모드" />
			<SettingInput key="flat-check-auto-roll-user" label="활성화" />
		</div>
	</SettingSection>

	<SettingSection>
		<img src="{FlatHiddenRoll}">
		<div class="justify-self-start">
			<h5>결과 숨기기</h5>
			<p>굴림에 단순 판정이 필요한 경우, 공개 전까지 결과가 숨겨집니다.</p>
			<SettingInput key="flat-check-hide-roll" label="활성화" />
			<hr>
			<SettingInput key="flat-check-hide-roll-auto-reveal" label="자동 공개" />
			<span>모든 단순 판정이 성공하면 결과가 자동으로 공개됩니다.</span>
			<SettingInput key="flat-check-hide-roll-players-can-reveal" label="플레이어 공개 허용" />
			<span>모든 단순 판정이 성공하지 않더라도 플레이어가 결과를 수동으로 공개할 수 있도록 허용합니다.</span>
		</div>
	</SettingSection>

	<SettingSection>
		<img src="{FlatOnTarget}">
		<div class="justify-self-start">
			<h5>대상에 단순 판정 표시</h5>
			<p>
				토큰을 대상으로 지정할 때 단순 판정 DC와 사유를 표시합니다. <br>
				토큰을 선택한 상태에서는 선택된 액터의 감각(약광 시야/암시야)을 사용하고 현혹과 같은 상태도 포함합니다.
			</p>
			<SettingInput key="flat-check-target-marker" label="모드" />
			<div class="mb-1"></div>
			<SettingInput key="flat-check-target-marker-display" label="표시 방식" />
		</div>
	</SettingSection>

	<SettingSection>
			<div class="col-span-2 mx-[10%]">
			<h5>단순 판정 구성</h5>
			<p>메시지와 토큰에 표시되는 단순 판정을 끌 수 있습니다.</p>
			<p>참고: 광원 수준 단순 판정은 기본적으로 비활성화되어 있으며 여기서 활성화해야 합니다.</p>
			<button onclick={() => new FlatMessageConfigApplication().render(true)}>
				<i class="fa-solid fa-gears"></i> 설정 열기
			</button>
		</div>
	</SettingSection>

	<SettingSection>
		<img src="{LightVis}">
		<div class="justify-self-start">
			<h5>광원 수준 시각화</h5>
			<p>
				<kbd>Alt</kbd> 키를 눌러 <span class="text-yellow-700 dark:text-yellow-500">약한 빛</span>이거나
				<span class="text-red-500">어둠</span>인 칸을 강조 표시합니다.
			</p>
			<SettingInput key="light-level-vis" label="활성화" />
		</div>
	</SettingSection>

	<SettingSection>
		<div class="col-span-2 mx-[10%]">
			<h5 class="text-center">호환성</h5>
			<strong>PF2e Visioner 지원</strong>
			<p>
				PF2e Visioner가 활성화되어 있고 대상 단순 판정이 활성화된 경우, Visioner의 감지 상태가 단순 판정에도 사용됩니다.
			</p>
		</div>
	</SettingSection>
</main>

<script lang="ts">
import { FlatMessageConfigApplication } from "src/modules/flat/message-config"
import SettingInput from "./component/setting-input.svelte"
import SettingSection from "./component/setting-section.svelte"
import FlatHiddenRoll from "./img/flat-hidden.roll.webp"
import FlatInMessage from "./img/flat-in-message.webp"
import FlatOnTarget from "./img/flat-on-target.webp"
import LightVis from "./img/light-vis.webp"

const sectionStyle = "grid grid-cols-2 gap-2 py-2 my-3 items-center even:bg-gray-500/25"
</script>

<style scoped>
	img {
		max-width: 300px;
		border-radius: 5px;
		justify-self: center;
	}
</style>
