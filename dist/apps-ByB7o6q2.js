import { a as e, i as t, o as n, r } from "./src-BBcyJme0.js";
import { C as i, E as a, I as o, L as s, M as c, O as l, P as u, R as d, S as f, T as p, W as m, _ as h, b as g, c as _, h as v, i as y, j as b, k as x, l as S, m as C, t as w, v as T, w as E, z as D } from "./disclose-version-BHnoM1HB.js";
//#region src/svelte/utils.ts
function O(e) {
	let t = (() => {
		let t = e.document.ring.enabled ? 1 / .7936514 : 1;
		return Math.max(1, e.document.texture.scaleX ?? 1) * t;
	})(), n = `transform:scale(${t});`;
	if (t > 1.2) {
		let e = 100 - Math.floor((t - .7) / t * 100), r = 100 - Math.floor((t - 1.15) / t * 100);
		n += `mask-image: radial-gradient(circle at center, black ${e}%, rgba(0, 0, 0, 0.2) ${r}%);`;
	}
	return {
		src: e.document.texture.src,
		style: n
	};
}
//#endregion
//#region src/modules/delay/apps/prompt.svelte
var k = g("<div><img/> <p class=\"grow overflow-hidden text-ellipsis max-w-[20ch] max-h-12 ml-0.5\" style=\"display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;\"> </p> <p class=\"ml-3\"> </p></div>"), A = g("<p class=\"text-center\">Empty combat?</p>"), j = g("<form class=\"p-2\"><div class=\"flex flex-col items-center\"><strong> </strong> <div class=\"py-3 overflow-y-auto overflow-x-visible max-h-125\"></div></div> <div class=\"flex flex-col gap-1\"><button type=\"submit\"><i></i> </button> <button type=\"button\"><i class=\"fa-solid fa-xmark\"></i> </button></div></form>");
function M(n, f) {
	D(f, !0);
	function g(e) {
		return e.parent != null;
	}
	if (!g(f.combatant)) throw Error("Combatant has no combat!");
	let w = f.combatant.parent, M = w.turns.filter((e) => e.initiative !== null), N = M.indexOf(f.combatant), P = [N];
	if (N > 0 && P.push(N - 1), w.settings.skipDefeated) for (let e = N + 1; e < M.length && M[e].defeated; e++) P.push(e);
	let F = o(!1), I = o(c(w.nextCombatant.id));
	async function L(e) {
		e.preventDefault(), u(F, !0), w.combatant === f.combatant && f.combatant.uuid && (r({ combatant: f.combatant }), await t({
			advanceTurn: !0,
			afterId: a(I),
			combatantUuid: f.combatant.uuid
		})), f.shell.close();
	}
	function R(e) {
		return !game.user.isGM && game.pf2e.settings.tokens.nameVisibility && !e.playersCanSeeName ? "?" : e.name;
	}
	var z = j(), B = x(z), V = x(B), H = x(V, !0);
	m(V);
	var U = b(V, 2);
	C(U, 21, () => M, v, (e, t, n) => {
		let r = s(() => P.includes(n)), o = s(() => a(t) === f.combatant), c = s(() => a(t).id === a(I));
		var d = k(), g = x(d);
		y(g, (e) => ({
			class: "h-full p-0.5",
			...e,
			inert: !0
		}), [() => O(a(t).token.object)]);
		var v = b(g, 2), C = x(v, !0);
		m(v);
		var w = b(v, 2), E = x(w, !0);
		m(w), m(d), l((e) => {
			_(d, 1, S([
				"flex items-center h-12.5 pl-1 pr-2 border",
				a(r) ? "cursor-not-allowed rounded-none" : "cursor-pointer rounded-sm",
				a(o) ? "dark:bg-green-300/20 bg-green-600/20 border-green-400" : a(r) ? "dark:bg-white/10 bg-black/10 border-transparent" : a(c) ? "dark:bg-white/20 bg-black/20 border-orange-400" : "border-transparent hover:border-gray-500"
			])), h(C, e), h(E, a(t).initiative);
		}, [() => R(a(t))]), i("click", d, () => {
			a(r) || u(I, a(t).id, !0);
		}), p(g), T(e, d);
	}, (e) => {
		T(e, A());
	}), m(U), m(B);
	var W = b(B, 2), G = x(W), K = x(G), q = b(K);
	m(G);
	var J = b(G, 2), Y = b(x(J));
	m(J), m(W), m(z), l((e, t, n) => {
		h(H, e), G.disabled = a(F), _(K, 1, S(["fa-solid fa-hourglass-start", a(F) && "animate-spin"])), h(q, ` ${t ?? ""}`), h(Y, ` ${n ?? ""}`);
	}, [
		() => e("delay.dialog.delay-after"),
		() => e("delay.dialog.confirm"),
		() => e("delay.dialog.cancel")
	]), E("submit", z, L), i("click", J, () => f.shell.close()), T(n, z), d();
}
f(["click"]);
//#endregion
//#region src/modules/delay/apps/index.ts
var N = class extends w(foundry.applications.api.ApplicationV2) {
	combatant;
	component = M;
	constructor(e) {
		super({ id: `${n}.delay.prompt` }), this.combatant = e;
	}
	async getProps() {
		return { combatant: this.combatant };
	}
	static DEFAULT_OPTIONS = { window: { title: e("delay.delay") } };
};
//#endregion
export { N as DelayPromptDialog };

//# sourceMappingURL=apps-ByB7o6q2.js.map