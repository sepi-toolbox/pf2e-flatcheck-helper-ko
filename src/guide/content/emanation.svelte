<h3 class="ml-4">발산 자동화</h3>

<div class="grid grid-cols-2 gap-2 gap-y-4 items-center">

	<div class="col-span-2 mx-[10%]">
		<p>발산 주문에 영역 내 모든 토큰에 주문 효과를 적용하는 버튼을 추가합니다.</p>
		<SettingInput key="emanation-automation" label="활성화"></SettingInput>

		<p>
			주문에 방어(수동 또는 내성 굴림)가 없고 영역이 발산으로 설정된 경우에만 주문 설정이 표시됩니다. <br>
			"적용 대상"이 설정된 경우 GM에게 "발산 효과 적용" 버튼이 표시됩니다.
		</p>
	</div>
	<figure class="col-span-2">
		<img src={ImgConfig}>
		<figcaption>주문 설정</figcaption>
	</figure>
	<div class="col-span-2 justify-self-center flex gap-2 items-center">
		<figure>
			<img src={ImgChatCard}>
			<figcaption>채팅의 발산 주문</figcaption>
		</figure>
		<figure>
			<img src={ImgDialog}>
			<figcaption>발산 적용 다이얼로그</figcaption>
		</figure>
	</div>
</div>

<script lang="ts">
import ImgChatCard from "src/guide/content/img/emanation-chat-card.webp"
import ImgConfig from "src/guide/content/img/emanation-config.webp"
import ImgDialog from "src/guide/content/img/emanation-dialog.webp"
import Important from "./component/important.svelte"
import SettingInput from "./component/setting-input.svelte"
</script>

<style>
	img {
		justify-self: center;
	}
</style>
