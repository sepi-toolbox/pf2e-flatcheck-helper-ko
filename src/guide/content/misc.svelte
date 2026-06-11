<h3 class="ml-4">기타</h3>

<div class="mx-[10%]">


	<h5>대체 굴림 내역</h5>
	<p>
		시스템은 모든 굴림 수정자를 플레이어에게 숨깁니다. 이 기능을 활성화하면 기본 수정자와 총합은 여전히 숨겨지지만 나머지 수정자가 공개됩니다.
	</p>

	<SettingInput key="script-alt-roll-breakdown" label="활성화" />

	<div class="flex justify-center gap-1">
		<figure>
			<img src="{ImgGM}">
			<figcaption>GM 시점</figcaption>
		</figure>
		<figure>
			<img src="{ImgPlayer}">
			<figcaption>플레이어 시점</figcaption>
		</figure>
	</div>

	<hr>

	<h5>공유 시야 자동 토글</h5>
	<p>전투가 시작되면 파티 공유 시야를 자동으로 끄고, 전투가 끝나면 다시 켭니다.</p>
	<p>
		왜? 탐험 중에는 뒤쪽에 갇혀서 무슨 일이 일어나는지 못 보는 것이 재미없습니다.
		하지만 전투 중에 공유 시야가 항상 켜져 있으면, 자신이 보는 것과 파티 전체가 보는 것을 구분하기 어려워 혼란스럽습니다.
	</p>


	<SettingInput key="script-toggle-shared-vision" label="활성화" />
</div>

	<script lang="ts">
import Important from "./component/important.svelte"
import SettingInput from "./component/setting-input.svelte"
import ImgGM from "./img/alt-roll-gm.webp"
import ImgPlayer from "./img/alt-roll-player.webp"
</script>
