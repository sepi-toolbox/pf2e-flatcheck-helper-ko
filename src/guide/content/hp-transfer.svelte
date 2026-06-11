<h3 class="ml-4">HP 이전 효과</h3>

<div class="grid grid-cols-2 gap-2 gap-y-4 items-center">
	<img src={Img} class="justify-self-center">
	<div>
		<p>
			채팅에 생명 결속, 생명 공유, 혼 결속의 효과를 자동화하는 버튼을 추가합니다.
			<Important>피해가 생물을 0 HP 미만으로 감소시키면 계산이 잘못될 수 있습니다</Important>
		</p>
		<SettingInput key="lifelink" label="활성화"></SettingInput>
		<SettingInput key="lifelink-formular" label="생명 결속 계산식"></SettingInput>
	</div>

	<div class="col-span-2 mx-[10%]">
		<strong>설정 방법</strong>
		<ol class="m-0!">
			<li>주문의 설명을 열어 편집합니다.</li>
			<li>이 모듈의 <a class="underline" onclick={() => game.packs.get("pf2e-flatcheck-helper.Effects")?.render(true)}>효과 모음집</a>을 엽니다.</li>
			<li>효과를 주문 설명에 드래그 앤 드롭합니다. <code>@UUID[...]{"{Share Life}"}</code> 형태의 링크가 생성됩니다.</li>
			<li>편집한 설명을 저장합니다.</li>
		</ol>
		<p>
			주문 효과는 채팅에 게시된 주문 카드(또는 액터 시트)에서 대상으로 드래그해야 합니다. 모음집에서 직접 효과를 사용하는 방식은 동작하지 않습니다.
		</p>
	</div>
</div>

<script lang="ts">
import Img from "src/guide/content/img/hp-transfer.webp"
import Important from "./component/important.svelte"
import SettingInput from "./component/setting-input.svelte"
</script>
