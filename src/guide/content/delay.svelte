<h3 class="ml-4">지연</h3>

<main>
	<SettingSection>
		<div class="col-span-2 mx-[10%]">
			<p>
				"적당히 쓸 만한" 지연 구현. <br>
				지연 버튼(아래 참조) 중 하나를 누르면 현재 생물의 차례가 종료되고 지연 중으로 표시됩니다. <br>
				다시 누르면 해당 생물이 현재 차례 뒤로 이동하여 우선권에 복귀합니다.
			</p>
			<SettingInput key="delay-create-message" label="지연/복귀 시 채팅 메시지 생성" />
		</div>
	</SettingSection>

	<SettingSection>
		<img src="{ImgButton}">
		<div>
			<SettingInput key="delay-combat-tracker" label="전투 트래커에 지연 버튼 표시" />
		</div>
	</SettingSection>

	<SettingSection>
		<img src="{ImgHudButton}" class="rounded!">
		<div>
			<div class="mb-1">
				<SettingInput key="delay-token-hud" label="토큰 HUD에 지연 버튼 표시" />
				<div>토큰을 우클릭하면 토큰 HUD가 나타납니다.</div>
			</div>
			<div class="mb-1">
				<SettingInput key="token-hud-remove-combat-toggle" label="전투 중인 토큰의 HUD에서 전투 토글 제거" />
			</div>

			<hr class="my-4">

			<p>
				지연 행동을 사용해서도 지연(및 복귀)할 수 있습니다. <br>
				(규칙 탭의) 슬러그가 <code>delay</code>로 설정된 모든 행동이 동작합니다.
			</p>
		</div>
	</SettingSection>

	<SettingSection>
		<div class="col-span-2 mx-[10%]">
			<h5 class="text-center">변형</h5>
			<div class="mb-2">
				<SettingInput key="delay-prompt" label="새 우선권 위치 묻기" />
				<div>
					이미 새 차례 위치를 알고 있는 경우가 많습니다. 이 변형은 어느 생물 뒤에 지연할지 묻고, 알맞은 차례까지 기다릴 필요를 없애줍니다. <br>
					그래도 복귀 버튼을 사용해 미리 복귀할 수 있습니다.
				</div>
			</div>
			<div class="mb-1">
				<SettingInput key="delay-return" label="복귀 비활성화" invert />
				<div>지연을 단순한 표시로만 만듭니다.</div>
			</div>
		</div>
	</SettingSection>

	<SettingSection>
		<div class="col-span-2 mx-[10%]">
			<h5 class="text-center">호환성</h5>
			<div>
				<SettingInput key="pf2e-hud-enable" label="PF2e HUD 수정" />
				<div>PF2e HUD의 지연 처리를 덮어씁니다. PF2e HUD 전투 트래커의 지연 버튼이 기본 트래커의 버튼과 유사하게 동작합니다.</div>
				<strong>이 설정을 켠 상태에서는 PF2e HUD에 문제를 보고하지 마세요!</strong>
			</div>
		</div>
	</SettingSection>

</main>

<script lang="ts">
import SettingInput from "./component/setting-input.svelte"
import SettingSection from "./component/setting-section.svelte"
import ImgButton from "./img/delay-button.webp"
import ImgHudButton from "./img/delay-hud-button.webp"

const sectionStyle =
	"grid grid-cols-2 gap-2 py-2 my-3 items-center even:bg-gray-500/25 dark:even:bg-gray-500/15"
</script>

<style scoped>
	img {
		max-width: 300px;
		justify-self: center;
	}
</style>
