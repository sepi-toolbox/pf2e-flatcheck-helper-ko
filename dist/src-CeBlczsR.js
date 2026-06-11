//#region src/constants.ts
var e = "pf2e-flatcheck-helper", t = { delay: { gmMoveAfter: `${e}.gmMoveAfter` } }, n = /* @__PURE__ */ new Map(), r = (e) => {
	let t = e.target, r = t instanceof HTMLElement && t.dataset.action;
	if (!r) return;
	let i = n.get(r);
	if (!i) return;
	let a = t.closest("li.chat-message[data-message-id]"), o = a?.dataset.messageId && game.messages.get(a.dataset.messageId);
	o && (e.preventDefault(), e.stopImmediatePropagation(), i(o, a, t));
}, i = {
	init() {
		for (let e of ["#ui-right #chat-notifications", "#sidebar-content #chat"]) document.body.querySelector(e)?.addEventListener("click", r);
	},
	register(e, t) {
		n.set(e, t);
	},
	unregister(e) {
		n.delete(e);
	}
}, a = class {
	enabled = !1;
	hooks = {};
	wrappers = [];
	sockets = [];
	settingListeners = [];
	queries = [];
	chatActions = [];
	hasSettingEnabled() {
		return this.settingsKey == null ? !0 : game.settings.get(e, this.settingsKey);
	}
	onReady() {}
	enable() {
		this.enabled = !0;
	}
	disable() {
		this.enabled = !1;
		for (let [e, t] of Object.entries(this.hooks)) Hooks.off(e, t);
		this.hooks = {};
		for (let t of this.wrappers) libWrapper.unregister(e, t);
		this.wrappers = [];
		for (let e of this.sockets) $.socketHandler.unregister(e);
		this.sockets = [];
		for (let e of this.queries) delete CONFIG.queries[e];
		this.queries = [];
		for (let e of this.settingListeners) $.settings.removeListener(e);
		this.settingListeners = [];
		for (let e of this.chatActions) i.unregister(e);
		this.chatActions = [];
	}
	registerHook(e, t) {
		this.hooks[e] = Hooks.on(e, t);
	}
	registerWrapper(t, n, r) {
		this.wrappers.push(libWrapper.register(e, t, n, r));
	}
	registerSocket(e, t) {
		this.sockets.push(e), $.socketHandler.register(e, t);
	}
	registerQuery(e, t) {
		CONFIG.queries[e] = t;
	}
	registerSettingListener(e, t) {
		$.settings.addListener(e, t);
	}
	registerChatAction(e, t) {
		this.chatActions.push(e), i.register(e, t);
	}
};
//#endregion
//#region src/utils.ts
function o(e, t) {
	return e.itemTypes.effect.find((e) => e.slug === t);
}
function s(e, t) {
	return e.itemTypes.effect.some((e) => e.slug === t);
}
function c(e) {
	return e.parent?.nextCombatant.tokenId === e.tokenId;
}
function l(e) {
	let t = document.createElement("template");
	return t.innerHTML = e, t.content;
}
function u(e, t) {
	return e.startsWith("pf2e-fc.") || (e = `pf2e-fc.${e}`), t ? game.i18n.localize(e, t) : game.i18n.localize(e);
}
var d = {
	get id() {
		return game.system.id;
	},
	filePath(e) {
		return `systems/${this.id}/${e}`;
	}
};
//#endregion
//#region src/modules/delay/utils.ts
function f(e) {
	return e.items.some((e) => e.slug === "x-delay");
}
function p(e, t, n) {
	let r = t.find((e) => t.indexOf(e) === t.indexOf(n) - 1), i = t.find((e) => t.indexOf(e) === t.indexOf(n) + 1), a = !!r && !!i, o = !!r && !i, s = !r && !!i, c = a && i.initiative < r.initiative, l = a && i.initiative < r.initiative, u = !!i && e.getCombatantWithHigherInit(n, i) === i, f = s || c && u ? i.initiative + 1 : o || l && r && !u ? r.initiative - 1 : a ? i.initiative : n.initiative, p = { [n.id]: { initiative: f } }, m = n.initiative;
	n.initiative = f;
	let h = t.filter((e) => e.initiative === f);
	if (n.initiative = m, h.length > 1) for (let e = 0; e < h.length; e++) {
		let t = h[e];
		p[t.id] ??= {}, p[t.id].overridePriority = e;
	}
	return Object.entries(p).map(([e, t]) => {
		let n = { _id: e };
		return t.initiative !== void 0 && (n.initiative = t.initiative), t.overridePriority !== void 0 && (n[`flags.${d.id}.overridePriority.${f}`] = t.overridePriority), n;
	});
}
function m(e) {
	let t = e.turn ?? -1, n = null;
	if (e.settings.skipDefeated) {
		for (let r = t + 1; r < e.turns.length; r++) if (!e.turns[r].isDefeated) {
			n = r;
			break;
		}
	} else n = t + 1;
	return n != null && n >= e.turns.length && (n = 0), n == null ? null : e.turns[n];
}
//#endregion
//#region src/modules/delay/query.ts
async function h(e) {
	try {
		if (game.user.isGM) await g(e);
		else {
			if (!game.users.activeGM) return ui.notifications.error(u("delay.errors.no-active-gm"));
			await game.users.activeGM?.query(t.delay.gmMoveAfter, e);
		}
	} catch (e) {
		let t = game.user.isGM ? "" : " (GM 및 플레이어)";
		ui.notifications.error(`우선권 업데이트 중 오류가 발생했습니다. 자세한 내용은 콘솔${t}을 확인하세요.`), console.error(e);
	}
}
async function g(e) {
	let t = fromUuidSync(e.combatantUuid), n = t?.parent, r = n?.combatants.get(e.afterId);
	if (!n || typeof t?.initiative != "number" || typeof r?.initiative != "number") return;
	let { promise: i, resolve: a, reject: o } = Promise.withResolvers(), s = null, c = null, l = () => {
		s !== null && (Hooks.off("updateCombatant", s), s = null), c !== null && (clearTimeout(c), c = null);
	}, u = !1, f = async () => {
		if (!u) {
			u = !0, l();
			try {
				if (n.combatant === t) return o(/* @__PURE__ */ Error("Combatant to move is the active combatant"));
				let r = n.turns.filter((e) => typeof e.initiative == "number" && e !== t), i = r.findIndex((t) => t.id === e.afterId);
				r.splice(i + 1, 0, t);
				let s = p(n, r, t);
				await n.updateEmbeddedDocuments("Combatant", s), a();
			} catch (e) {
				o(e);
			}
		}
	}, h = !1, g = !1;
	if (e.advanceTurn) {
		if (n.combatant !== t) return console.error("Delay: Refusing to advance turn because the current combatant changed"), o(/* @__PURE__ */ Error("Refusing to advance turn because the current combatant changed")), i;
		if (n.combatant.flags[d.id].roundOfLastTurnEnd !== n.round && (h = !0), m(n)?.flags[d.id].roundOfLastTurn !== n.round && (g = !0), h || g) {
			let e = !1, t = !1;
			c = setTimeout(() => {
				u || (console.warn("handleGmMoveQuery timed out"), l(), o(/* @__PURE__ */ Error("Timeout")));
			}, 2e3), s = Hooks.on("updateCombatant", (n, r) => {
				try {
					typeof r?.flags?.[d.id]?.roundOfLastTurnEnd == "number" && (e = !0), typeof r?.flags?.[d.id]?.roundOfLastTurn == "number" && (t = !0), (e && t || !g && e || !h && t) && f();
				} catch (e) {
					l(), o(e);
				}
			});
		}
		n = await n.nextTurn();
	}
	let _ = h || g;
	return (!e.advanceTurn || !_) && f(), i;
}
//#endregion
//#region src/modules/delay/delay.ts
async function _(e) {
	let t = e.combatant, n = e.combatant.parent;
	if (!n?.started) return ui.notifications.error(u("delay.errors.combat-not-started"));
	if (!t.isOwner) return ui.notifications.error(u("delay.errors.combatant-not-owned"));
	let r = e?.type;
	r || (t?.actor && f(t.actor) ? r = "return" : t === n.combatant && (r = "delay")), r === "delay" ? ee(e) : r === "return" && ne(e);
}
function ee(e) {
	$.settings.delayShouldPrompt ? import("./apps-yaFyXDxY.js").then((t) => new t.DelayPromptDialog(e.combatant).render(!0)) : (te(e), e.combatant.parent?.nextTurn());
}
function te({ combatant: e, skipMessage: t }) {
	!t && e.token && v(e.token, "delay"), e.actor && re(e.actor);
}
async function ne(e) {
	if (c(e.combatant)) return;
	let t = e.combatant.parent?.combatant;
	t && e.combatant.uuid && (await h({
		combatantUuid: e.combatant.uuid,
		advanceTurn: !1,
		afterId: t.id
	}), e.combatant.token && v(e.combatant.token, "return"));
}
function v(e, t) {
	if ($.settings.delayCreateMessage) {
		let n = u(`delay.actions.${t}`);
		ChatMessage.create({
			speaker: ChatMessage.getSpeaker({ token: e }),
			content: `<div class="pf2e chat-card action-card">
      <header class="card-header flexrow">
			<img src="${d.filePath("icons/actions/FreeAction.webp")}" alt="${n}">
			<h3>${n} <span class="action-glyph">F</span></h3>
      </header>
			</div>`
		});
	}
}
async function re(e) {
	return e.createEmbeddedDocuments("Item", [{
		type: "effect",
		name: u("delay.delay"),
		img: "icons/svg/clockwork.svg",
		system: {
			tokenIcon: { show: !0 },
			duration: {
				value: -1,
				unit: "encounter",
				sustained: !1,
				expiry: "turn-start"
			},
			slug: "x-delay"
		}
	}]);
}
async function ie(e) {
	let t = e.items.filter((e) => e.slug === "x-delay");
	t.length && await e.deleteEmbeddedDocuments("Item", t.map((e) => e.id));
}
//#endregion
//#region src/modules/delay/pf2e-hud.ts
function ae(e, t) {
	if (!$.settings.modifyPF2eHud) return;
	let n = e.viewed;
	if (n?.started) for (let e of t.querySelectorAll("ol.combatants li.combatant")) {
		let t = e.dataset.combatantId;
		if (!t) continue;
		let r = n.combatants.get(t);
		if (!r?.isOwner || r.initiative == null) continue;
		let i = null;
		if (game.user.isGM) i = e.querySelector("div.extras a.delay");
		else {
			let t = e.querySelector("div.extras span.entry.initiative");
			if (!t) continue;
			i = t.querySelector("i.fa-solid.fa-hourglass-start") ?? t.querySelector("i.fa-solid.fa-dice-d20");
		}
		if (!i) continue;
		let a = null;
		n.combatant === r ? a = "delay" : r.actor && f(r.actor) && (a = "return");
		let o = null;
		if (a == null) {
			let e = document.createElement("i");
			e.classList.add("fa-solid", "fa-dice-d20"), i.replaceWith(e);
		} else if (a === "delay") o = l(`
				<a class="delay" data-tooltip="${u("delay.delay")}">
	  	    <i class="fa-solid fa-clock"></i>
  	  	</a>`);
		else if (a === "return") if ($.settings.allowReturn) o = l(`
					<a class="delay-return" data-tooltip="${u("delay.return-to-initiative")}">
						<i class="fa-solid fa-hourglass delay-indicator"></i>
					</a>`);
		else {
			let e = l(`<i class="fa-solid fa-hourglass delay-indicator" data-tooltip="${u("delay.delaying")}">`);
			i.replaceWith(e);
		}
		o && (o.firstElementChild?.addEventListener("click", () => {
			_({
				combatant: r,
				type: a
			});
		}), i.replaceWith(o));
	}
}
//#endregion
//#region src/modules/delay/token-hud.ts
function oe(e, t) {
	$.settings.showInTokenHUD && se(e, t), $.settings.removeCombatToggle && ce(e, t);
}
function se(e, t) {
	let n = e.object.combatant;
	if (n?.parent?.started && n.initiative != null && n.actor && n.isOwner) {
		let e = t.querySelector("div.col.right");
		if (!e) return;
		let r = null;
		if (f(n.actor) ? !c(n) && $.settings.allowReturn && (r = {
			icon: "fa-play",
			title: u("delay.return-to-initiative"),
			type: "return"
		}) : n.parent.combatant?.id === n.id && (r = {
			icon: "fa-hourglass",
			title: u("delay.delay"),
			type: "delay"
		}), r) {
			let t = l(`
					<div class="control-icon" style="display: flex;" data-action="delay" title="${r.title}">
						<i class="fa-solid ${r.icon}"></i>
					</div>`);
			t.firstElementChild?.addEventListener("click", () => {
				_({
					combatant: n,
					type: r.type
				});
			}), e.append(t);
		}
	}
}
function ce(e, t) {
	let n = e.object?.combatant;
	if (n?.parent.started && n.initiative != null) {
		let e = t.querySelector("button.control-icon[data-action=combat]");
		e && (e.style.display = "none");
	}
}
//#endregion
//#region src/modules/delay/tracker.ts
function le(e, t, n) {
	if (!$.settings.showInCombatTracker) return;
	let r = game.combat;
	if (!r?.started) return;
	let i = t.querySelectorAll("li.combatant");
	for (let e of i) {
		let t = e.dataset.combatantId;
		if (!t) continue;
		let n = r.combatants.get(t);
		!n?.isOwner || n.initiative == null || (r.combatant?.id === n.id ? ue("delay", e, n) : n.actor && f(n.actor) && ue("return", e, n));
	}
}
function ue(e, t, n) {
	let r;
	if (e === "delay") r = l(`
			<div class="initiative-delay" title="${u("delay.delay")}">
      	<i class="fa-solid fa-hourglass"></i>
			</div>
		`);
	else {
		let e = $.settings.allowReturn ? u("delay.return-to-initiative") : u("delay.delaying");
		r = l(`
      <div class="${$.settings.allowReturn ? "initiative-return" : "initiative-delay-indicator"}" title="${e}">
        <img class="delay-indicator" src="icons/svg/clockwork.svg"></img>
        <i class="fa-solid fa-play"></i>
      </div>
    `);
	}
	$.settings.allowReturn && r.firstElementChild?.addEventListener("click", (t) => {
		t.stopPropagation(), _({
			combatant: n,
			type: e
		});
	});
	let i = t.querySelector(".token-initiative");
	i && (i.style.display = "none"), t.append(r);
}
//#endregion
//#region src/modules/delay/index.ts
var de = class extends a {
	settingsKey = null;
	enable() {
		super.enable(), this.registerHook("renderEncounterTracker", le), this.registerHook("renderTokenHUD", oe), this.registerHook("updateCombat", fe), this.registerHook("createChatMessage", pe), this.registerHook("renderTrackerPF2eHUD", ae), this.registerQuery(t.delay.gmMoveAfter, g);
	}
};
function fe(e) {
	game.user && game.user.id !== game.users?.activeGM?.id || e.combatant?.actor && ie(e.combatant.actor);
}
function pe(e) {
	if (e?.author?.id !== game.user?.id || !game.combat?.started) return;
	let t = e?.item;
	t?.actor?.isOwner && t.actor.combatant && t?.type === "action" && t.slug === "delay" && _({
		combatant: t.actor.combatant,
		skipMessage: !0
	});
}
//#endregion
//#region src/modules/emanation/emanation-dialog.ts
var me = class extends foundry.appv1.api.Application {
	#e;
	cache;
	constructor(e) {
		super(), this.#e = e;
	}
	async getData() {
		if (!this.cache) {
			let [e, t, n] = await Promise.all([
				fromUuid(this.#e.spellUuid),
				fromUuid(this.#e.effectUuid),
				fromUuid(this.#e.originToken)
			]);
			if (!e) throw Error("resolving spell UUID failed");
			if (!t) throw Error("resolving effect UUID failed");
			if (!n) throw Error("resolving origin UUID failed");
			if (!n.actor) throw Error("origin token has no actor");
			let r = y(e), i = n.actor.alliance, a = canvas.tokens.placeables.filter((t) => (r.emanationAllies && t.document.actor?.alliance === i || r.emanationEnemies && t.document.actor?.alliance !== i) && n.object && t.distanceTo(n.object) <= e.system.area.value && !CONFIG.Canvas.polygonBackends.sight.testCollision(n.object.center, t.center, {
				mode: "any",
				type: "sight"
			}));
			if (r.emanationExcludeSelf) {
				let e = a.findIndex((e) => e.actor?.id === n.actor?.id);
				e !== -1 && a.splice(e, 1);
			}
			this.cache = {
				spell: e,
				effect: t,
				targets: a.map((e) => e.document),
				origin: n,
				durationOverride: r.emanationPromptDuration
			};
		}
		return { ...this.cache };
	}
	activateListeners(e) {
		super.activateListeners(e), e.on("submit", (e) => this.submit(e)), e.find("a.content-link").on("click", () => {
			this.cache.effect.sheet.render(!0);
		}), e.find("button[data-action=\"cancel\"]").on("click", () => this.close());
	}
	async submit(e) {
		e.preventDefault();
		let t = this.element.find("input[type=\"number\"]").val(), n = /* @__PURE__ */ new Set();
		this.element.find("input[type=\"checkbox\"]").each((e, t) => {
			t.checked || n.add(t.dataset.id);
		});
		let r = { "system.context.origin": {
			token: this.cache.origin.uuid,
			actor: this.cache.origin.actor?.uuid,
			item: this.cache.effect.uuid
		} };
		t && (r["system.duration.value"] = t);
		let i = foundry.utils.mergeObject(this.cache.effect.toObject(), r);
		for (let e of this.cache.targets) n.has(e.id) || e.actor?.createEmbeddedDocuments("Item", [i]);
		this.close();
	}
	static get defaultOptions() {
		return {
			...super.defaultOptions,
			title: u("emanation.dialog-effect-title"),
			template: `modules/${e}/templates/emanation-request.hbs`,
			width: "auto",
			height: "auto",
			classes: ["fc-emanation"]
		};
	}
}, he = class extends a {
	settingsKey = "emanation-automation";
	enable() {
		game.modules.get("lib-wrapper")?.active && (super.enable(), this.registerHook("renderChatMessageHTML", ve));
	}
	onReady() {
		this.registerWrapper("CONFIG.Item.sheetClasses.spell[\"pf2e.SpellSheetPF2e\"].cls.prototype._renderInner", be, "WRAPPER"), this.registerWrapper("CONFIG.Item.sheetClasses.spell[\"pf2e.SpellSheetPF2e\"].cls.prototype.activateListeners", xe, "WRAPPER");
	}
};
function y(t) {
	return {
		emanationAllies: t.getFlag(e, "emanation-allies"),
		emanationEnemies: t.getFlag(e, "emanation-enemies"),
		emanationExcludeSelf: t.getFlag(e, "emanation-exclude-self"),
		emanationPromptDuration: t.getFlag(e, "emanation-prompt-duration")
	};
}
function b(e) {
	return e.system.area?.type === "emanation" && e.system.area.value && !e.system.defense;
}
function ge(e) {
	return b(e) ? [...e.system.description.value.matchAll(/@UUID\[(.+?)\]/g)].reduce((e, t) => {
		let n = t.at(1);
		return n && e.push(n), e;
	}, []) : null;
}
async function _e(e) {
	let t = ge(e);
	return t ? (await Promise.all(t.map((e) => fromUuid(e)))).filter((e) => typeof e?.isOfType == "function" && e?.isOfType("effect")) : [];
}
async function ve(e, t) {
	if (!$.settings.emanationAutomation || !game.user.isGM || !e.item?.isOfType("spell")) return;
	let n = e.item, r = n.system.area?.type === "emanation" ? n.system.area?.value : null, i = e.actor?.getActiveTokens().at(0);
	if (!i || !r) return;
	let a = y(n), o = (await _e(n)).at(0);
	if (!o || !(a.emanationAllies || a.emanationEnemies)) return;
	let s = l(`<div class="spell-button">
		<button type="button" data-action="emanation-automation">${u("emanation.message-text")}</button>
	</div>`);
	s.querySelector("button")?.addEventListener("click", () => {
		new me({
			spellUuid: n.uuid,
			effectUuid: o.uuid,
			originToken: i.document.uuid
		}).render(!0);
	}), t.querySelector("section.card-buttons")?.append(s);
}
async function ye(e, t) {
	if (!b(e.item)) return;
	let n = await _e(e.item);
	if (!n) return;
	let { emanationAllies: r, emanationExcludeSelf: i, emanationEnemies: a, emanationPromptDuration: o } = y(e.item), s = (e) => e ? "checked" : "", c = n.length === 1 ? `
  <div class="form-group">
    <label>Apply to</label>
    <div class="form-fields" style="justify-content: start">
      <input type="checkbox" id="field-${e.id}-emanation-allies" ${s(r)}>
      <label for="field-${e.id}-emanation-allies">${u("emanation.form-allies")}</label>

      <input type="checkbox" id="field-${e.id}-emanation-exclude-self" ${s(i)}>
      <label for="field-${e.id}-emanation-self">${u("emanation.form-exclude-self")}</label>

      <input type="checkbox" id="field-${e.id}-emanation-enemies" ${s(a)}>
      <label for="field-${e.id}-emanation-enemies">${u("emanation.form-enemies")}</label>
    </div>
  </div>
  <div class="form-group" title="${u("emanation.form-duration-title")}">
    <label for="field-${e.id}-emanation-prompt-duration">${u("emanation.form-duration-prompt")}</label>
    <div class="form-fields" style="justify-content: start">
      <input type="checkbox" id="field-${e.id}-emanation-prompt-duration" ${s(o)}>
      <i class="fa-solid fa-circle-info" style="cursor: help;"></i>
    </div>
  </div>
` : `<p>${u("emanation.form-formatting-error")}</p>`;
	t.find("fieldset.publication").before(`
    <fieldset class="emanation-automation">
      <legend>
        ${u("emanation.form-fieldset-legend")}
        <span style="font-weight: lighter;">(pf2e Utility Buttons)</span>
      </legend>

      ${c}

    </fieldset>
  `);
}
async function be(e, ...t) {
	let n = await e(...t);
	try {
		$.settings.emanationAutomation && await ye(this, n);
	} catch (e) {
		ui.notifications.error("주문 시트에 발산 자동화를 삽입하지 못했습니다."), console.error(e);
	}
	return n;
}
function xe(t, n) {
	return t(n), n.find(`input#field-${this.id}-emanation-allies`).on("change", (t) => {
		this.item.setFlag(e, "emanation-allies", t.target.checked);
	}), n.find(`input#field-${this.id}-emanation-enemies`).on("change", (t) => {
		this.item.setFlag(e, "emanation-enemies", t.target.checked);
	}), n.find(`input#field-${this.id}-emanation-exclude-self`).on("change", (t) => {
		this.item.setFlag(e, "emanation-exclude-self", t.target.checked);
	}), n.find(`input#field-${this.id}-emanation-prompt-duration`).on("change", (t) => {
		this.item.setFlag(e, "emanation-prompt-duration", t.target.checked);
	}), n;
}
//#endregion
//#region src/modules/flat/light/utils.ts
var Se = class {
	width;
	height;
	#e;
	constructor(e, t) {
		this.width = e, this.height = t, this.#e = Array(e * t);
	}
	index(e, t) {
		return t * this.width + e;
	}
	get(e, t) {
		return this.#e[this.index(e, t)];
	}
	getOrNull(e, t) {
		return this.isValid(e, t) ? this.get(e, t) : null;
	}
	set(e, t, n) {
		this.#e[this.index(e, t)] = n;
	}
	isValid(e, t) {
		return 0 <= e && e < this.width && 0 <= t && t < this.height;
	}
}, x = Object.freeze({
	DARK: {
		color: new PIXI.Color(16711680),
		darknessBreakpoint: 1
	},
	DIM: {
		color: new PIXI.Color(16776960),
		darknessBreakpoint: .75
	},
	BRIGHT: {
		color: new PIXI.Color(65280),
		darknessBreakpoint: .25
	},
	fromExposure(e) {
		return e <= x.BRIGHT.darknessBreakpoint ? x.BRIGHT : e < x.DIM.darknessBreakpoint ? x.DIM : x.DARK;
	}
}), Ce = Object.freeze({
	UNKNOWN: new PIXI.Color(12255487),
	HIDDEN: new PIXI.Color(16711680),
	INBETWEEN: new PIXI.Color(16744448),
	CONCEALED: new PIXI.Color(16776960),
	BETTER: new PIXI.Color(13696768),
	fromDC(e) {
		return e == null ? this.UNKNOWN : e < 5 ? this.BETTER : e === 5 ? this.CONCEALED : e < 11 ? this.INBETWEEN : this.HIDDEN;
	}
});
function S(e, t) {
	for (let n of canvas.effects.darknessSources) if (n.shape.contains(e, t)) return x.DARK.darknessBreakpoint;
	let n = x.DARK.darknessBreakpoint;
	for (let r of canvas.effects.lightSources) {
		if (!r.active || r instanceof foundry.canvas.sources.GlobalLightSource || !r.shape.contains(e, t)) continue;
		let i = Math.sqrt(Math.abs(r.x - e) ** 2 + Math.abs(r.y - t) ** 2);
		if (i <= r.data.bright) return 0;
		i <= r.data.dim && (n = .5);
	}
	let r = canvas.effects.getDarknessLevel({
		x: e,
		y: t,
		elevation: 0
	});
	return Math.min(n, r);
}
//#endregion
//#region src/modules/flat/light/layer.ts
var we = class extends foundry.canvas.layers.InteractionLayer {
	_draw(e) {
		return super._draw(e);
	}
	static get layerOptions() {
		return foundry.utils.mergeObject(super.layerOptions, { name: "lightVis" });
	}
	get sortLayer() {
		return 501;
	}
}, Te = class {
	#e = null;
	#t() {
		return this.#e = new PIXI.Graphics(), canvas.lightVis.addChild(this.#e), this.#e;
	}
	get layer() {
		return this.#e ?? this.#t();
	}
	destroy() {
		this.#e?.destroy(), this.#e = null;
	}
	clear() {
		this.#e?.clear(), this.#e?.removeChildren();
	}
	drawMesh() {
		let e = canvas.scene.grid.size, t = e / 2, n = Math.ceil(canvas.scene.dimensions.width / e), r = Math.ceil(canvas.scene.dimensions.height / e), i = new PIXI.Graphics(), a = new Se(n, r);
		for (let i = 0; i < n; i++) for (let n = 0; n < r; n++) {
			let r = S(t + i * e, t + n * e);
			a.set(i, n, x.fromExposure(r));
		}
		for (let t = 0; t < n; t++) for (let n = 0; n < r; n++) {
			let r = t * e, o = n * e, s = a.get(t, n);
			if (s !== x.BRIGHT) {
				let t = s.color;
				i.lineStyle(0), i.beginFill(t, .25).drawRect(r, o, e, e).endFill();
			}
		}
		this.layer.addChild(i);
	}
	drawPoints() {
		let e = canvas.scene.grid.size, t = e / 2, n = Math.ceil(canvas.scene.dimensions.width / e) + 1, r = Math.ceil(canvas.scene.dimensions.height / e) + 1, i = new PIXI.Graphics(), a = (e, t) => {
			let n = S(e, t), r = x.fromExposure(n), a = r.color;
			i.beginFill(a, 1), r === x.BRIGHT ? i.drawCircle(e, t, 5) : r === x.DIM ? i.drawRect(e - 3, t - 3, 6, 6) : i.drawRoundedRect(e - 4, t - 4, 8, 8, 3);
		};
		for (let i = 0; i < n; i++) for (let o = 0; o < r; o++) {
			let r = i * e, s = o * e;
			a(r, s), i < n - 1 && o < n - 1 && a(r + t, s + t);
		}
		this.layer.addChild(i);
	}
	drawText() {
		let e = canvas.scene.grid.size, { width: t, height: n } = canvas.scene.dimensions;
		for (let r = e / 2; r < t; r += e) for (let t = e / 2; t < n; t += e) {
			let e = S(r, t), n = e <= x.BRIGHT.darknessBreakpoint ? "#00ff00" : e <= x.DIM.darknessBreakpoint ? "#ffff00" : "#ff0000", i = new PIXI.Text(e.toFixed(2).toLocaleLowerCase(), new PIXI.TextStyle({ fill: n }));
			i.x = r, i.y = t, i.anchor.set(.5), this.layer.addChild(i);
		}
	}
	draw() {
		this.destroy(), this.drawMesh();
	}
}, Ee = class extends a {
	settingsKey = "light-level-vis";
	layerRenderer;
	enable() {
		CONFIG.Canvas.layers.lightVis = {
			layerClass: we,
			group: "primary"
		}, this.layerRenderer = new Te(), this.registerHook("highlightObjects", (e) => {
			e ? this.layerRenderer?.draw() : this.layerRenderer?.destroy();
		});
	}
}, De = {
	observed: 0,
	concealed: 1,
	hidden: 2,
	undetected: 4,
	unnoticed: 5,
	unknown: 6
}, Oe = {
	dazzled: "concealed",
	blinded: "hidden"
}, C = {
	observed: 0,
	concealed: 5,
	hidden: 11,
	undetected: 11,
	unnoticed: null,
	unknown: null
}, ke = [
	"army",
	"character",
	"familiar",
	"npc"
];
//#endregion
//#region node_modules/.pnpm/remeda@2.34.1/node_modules/remeda/dist/lazyDataLastImpl-DtF3cihj.js
function Ae(e, t, n) {
	let r = (n) => e(n, ...t);
	return n === void 0 ? r : Object.assign(r, {
		lazy: n,
		lazyArgs: t
	});
}
//#endregion
//#region node_modules/.pnpm/remeda@2.34.1/node_modules/remeda/dist/purry.js
function w(e, t, n) {
	let r = e.length - t.length;
	if (r === 0) return e(...t);
	if (r === 1) return Ae(e, t, n);
	throw Error("Wrong number of arguments");
}
//#endregion
//#region node_modules/.pnpm/remeda@2.34.1/node_modules/remeda/dist/utilityEvaluators-Cb8x6-JZ.js
var je = {
	done: !1,
	hasNext: !1
};
//#endregion
//#region node_modules/.pnpm/remeda@2.34.1/node_modules/remeda/dist/pipe.js
function Me(e, ...t) {
	let n = e, r = t.map((e) => "lazy" in e ? Pe(e) : void 0), i = 0;
	for (; i < t.length;) {
		if (r[i] === void 0 || !Fe(n)) {
			let e = t[i];
			n = e(n), i += 1;
			continue;
		}
		let e = [];
		for (let n = i; n < t.length; n++) {
			let t = r[n];
			if (t === void 0 || (e.push(t), t.isSingle)) break;
		}
		let a = [];
		for (let t of n) if (Ne(t, a, e)) break;
		let { isSingle: o } = e.at(-1);
		n = o ? a[0] : a, i += e.length;
	}
	return n;
}
function Ne(e, t, n) {
	if (n.length === 0) return t.push(e), !1;
	let r = e, i = je, a = !1;
	for (let [e, o] of n.entries()) {
		let { index: s, items: c } = o;
		if (c.push(r), i = o(r, s, c), o.index += 1, i.hasNext) {
			if (i.hasMany ?? !1) {
				for (let r of i.next) if (Ne(r, t, n.slice(e + 1))) return !0;
				return a;
			}
			r = i.next;
		}
		if (!i.hasNext) break;
		i.done && (a = !0);
	}
	return i.hasNext && t.push(r), a;
}
function Pe(e) {
	let { lazy: t, lazyArgs: n } = e, r = t(...n);
	return Object.assign(r, {
		isSingle: t.single ?? !1,
		index: 0,
		items: []
	});
}
function Fe(e) {
	return typeof e == "string" || typeof e == "object" && !!e && Symbol.iterator in e;
}
//#endregion
//#region node_modules/.pnpm/remeda@2.34.1/node_modules/remeda/dist/hasAtLeast.js
function Ie(...e) {
	return w(Le, e);
}
var Le = (e, t) => e.length >= t, Re = {
	asc: (e, t) => e > t,
	desc: (e, t) => e < t
};
function ze(e, t) {
	let [n, ...r] = t;
	if (!Be(n)) return e(n, T(...r));
	let i = T(n, ...r);
	return (t) => e(t, i);
}
function T(e, t, ...n) {
	let r = typeof e == "function" ? e : e[0], i = typeof e == "function" ? "asc" : e[1], { [i]: a } = Re, o = t === void 0 ? void 0 : T(t, ...n);
	return (e, t) => {
		let n = r(e), i = r(t);
		return a(n, i) ? 1 : a(i, n) ? -1 : o?.(e, t) ?? 0;
	};
}
function Be(e) {
	if (E(e)) return !0;
	if (typeof e != "object" || !Array.isArray(e)) return !1;
	let [t, n, ...r] = e;
	return E(t) && typeof n == "string" && n in Re && r.length === 0;
}
var E = (e) => typeof e == "function" && e.length === 1;
//#endregion
//#region node_modules/.pnpm/remeda@2.34.1/node_modules/remeda/dist/filter.js
function D(...e) {
	return w(Ve, e, He);
}
var Ve = (e, t) => e.filter(t), He = (e) => (t, n, r) => e(t, n, r) ? {
	done: !1,
	hasNext: !0,
	next: t
} : je;
//#endregion
//#region node_modules/.pnpm/remeda@2.34.1/node_modules/remeda/dist/firstBy.js
function O(...e) {
	return ze(Ue, e);
}
function Ue(e, t) {
	if (!Ie(e, 2)) return e[0];
	let [n] = e, [, ...r] = e;
	for (let e of r) t(e, n) < 0 && (n = e);
	return n;
}
//#endregion
//#region node_modules/.pnpm/remeda@2.34.1/node_modules/remeda/dist/groupBy.js
function We(...e) {
	return w(Ge, e);
}
var Ge = (e, t) => {
	let n = Object.create(null);
	for (let r = 0; r < e.length; r++) {
		let i = e[r], a = t(i, r, e);
		if (a !== void 0) {
			let e = n[a];
			e === void 0 ? n[a] = [i] : e.push(i);
		}
	}
	return Object.setPrototypeOf(n, Object.prototype), n;
};
//#endregion
//#region node_modules/.pnpm/remeda@2.34.1/node_modules/remeda/dist/map.js
function Ke(...e) {
	return w(qe, e, Je);
}
var qe = (e, t) => e.map(t), Je = (e) => (t, n, r) => ({
	done: !1,
	hasNext: !0,
	next: e(t, n, r)
}), k = class t extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
	static PARTS = {
		form: { template: "modules/pf2e-flatcheck-helper/templates/message-config.hbs" },
		footer: { template: "templates/generic/form-footer.hbs" }
	};
	static DEFAULT_OPTIONS = {
		id: "fc-flat-check-config",
		tag: "form",
		window: { title: "단순 판정 설정" },
		form: {
			handler: t.onSubmit,
			submitOnChange: !1,
			closeOnSubmit: !0
		}
	};
	static async onSubmit(t, n, r) {
		let i = [], a = [];
		for (let [e, t] of Object.entries(r.object)) A.includes(e) && !t && i.push(e), j.includes(e) && t && a.push(e);
		game.settings.set(e, "flat-check-config", {
			ignoredCheckTypes: i,
			experimentalCheckTypes: a
		});
	}
	async _prepareContext(e) {
		let { ignored: t, experimental: n } = M.toSets();
		return {
			buttons: [{
				type: "submit",
				icon: "fa-solid fa-save",
				label: "SETTINGS.Save"
			}],
			types: [...A.map((e) => ({
				key: e,
				checked: !t.has(e)
			})), ...j.map((e) => ({
				key: e,
				checked: n.has(e)
			}))],
			i18n: (e) => u(`flat-config.${e}`)
		};
	}
}, A = [
	"stupefied",
	"manipulate",
	"deafened",
	"deafened-spellcasting",
	"target"
], j = ["light-level"];
function Ye() {
	return game.settings.get(e, "flat-check-config");
}
var M = {
	checkTypes: A,
	experimentalTypes: j,
	toSets() {
		let e = Ye();
		return {
			ignored: new Set(e.ignoredCheckTypes),
			experimental: new Set(e.experimentalCheckTypes)
		};
	}
};
//#endregion
//#region src/modules/flat/light/token.ts
function Xe(e) {
	let t = e.scene.grid.size, n = t / 2, r = e.scene.dimensions, i = x.DARK.darknessBreakpoint;
	if (e.bounds.width < t || e.bounds.height < t) {
		let t = e.bounds.width / 2, n = e.bounds.height / 2, r = S(t + e.x, n + e.y);
		i = Math.min(i, r);
	} else for (let a = n; a < e.bounds.width; a += t) for (let o = n; o < e.bounds.height; o += t) {
		let t = a + e.x, n = o + e.y;
		if (t >= 0 && t <= r.width && n >= 0 && n <= r.height) {
			let e = S(t, n);
			i = Math.min(i, e);
		}
	}
	return i;
}
var N = new class {
	map = /* @__PURE__ */ new Map();
	calculate(e) {
		let t = e.object ? Xe(e.object) : 0;
		return this.map.set(e, t), t;
	}
	get(e) {
		return this.map.get(e) ?? this.calculate(e);
	}
	invalidate(e) {
		this.map.delete(e);
	}
	invalidateAll() {
		this.map.clear();
	}
	useCount = 0;
	enable() {
		this.useCount === 0 && (this.registerHook("canvasTearDown", () => this.invalidateAll()), this.registerHook("lightingRefresh", foundry.utils.debounce(() => this.invalidateAll(), 50)), this.registerHook("updateToken", (e, t) => {
			("x" in t || "y" in t || "elevation" in t || "width" in t || "height" in t) && this.invalidate(e);
		})), this.useCount++;
	}
	disable() {
		if (this.useCount === 1) {
			for (let [e, t] of this.hooks.entries()) Hooks.off(e, t);
			this.hooks.clear();
		}
		this.useCount = Math.max(this.useCount - 1, 0);
	}
	hooks = /* @__PURE__ */ new Map();
	registerHook(e, t) {
		let n = Hooks.on(e, t);
		this.hooks.set(e, n);
	}
}();
function P(e) {
	let t = e.document ? N.get(e.document) : 0;
	return x.fromExposure(t);
}
//#endregion
//#region src/modules/flat/rules/options.ts
function F(e, t) {
	let n = P(t);
	return `${e}:fc-light:${n === x.DARK ? "dark" : n === x.DIM ? "dim" : "bright"}`;
}
function Ze(e) {
	let t = [];
	return e.type && t.push(`fc:type:${e.type}`), e.baseDc != null && t.push(`fc:base-dc:${e.baseDc}`), e.origin && t.push(`fc:origin:${e.origin.slug}`), t;
}
function Qe(e) {
	let t = [], n = e.flags[d.id].context;
	return n && "contextualOptions" in n && n.contextualOptions?.postRoll?.length && t.push(n.contextualOptions.postRoll), n && "options" in n && n.options?.length && t.push(n.options), t.flat();
}
function $e(e) {
	let t = [];
	if (e.msg?.item && t.push(e.msg.item.getRollOptions("item")), e.origin?.actor && t.push(e.origin.actor.getRollOptions()), e.target?.actor && t.push(e.target.actor.getSelfRollOptions("target")), e.origin?.object && e.target?.object) {
		let n = e.origin.object.distanceTo(e.target.object);
		Number.isInteger(n) && t.push(`target:distance:${n}`), t.push("target");
	}
	return t.flat();
}
function et({ self: e, target: t, msg: n }) {
	let r = [];
	return n?.token?.object && n.target?.token.object && (e = n.token.object, t = n.target.token.object), e && r.push(F("self", e)), t && r.push(F("target", t)), r.flat();
}
var I = {
	forCheck: Ze,
	forRollMessage: Qe,
	forMixed: $e,
	lightLevelOptions: et
}, L = foundry.data.fields, tt = {
	condition: new L.StringField({
		required: !0,
		blank: !1,
		choices: [
			"observed",
			"concealed",
			"hidden",
			"all"
		]
	}),
	treatAs: new L.StringField({
		required: !0,
		blank: !1,
		choices: [
			"observed",
			"concealed",
			"hidden"
		]
	}),
	mode: new L.StringField({
		required: !0,
		blank: !1,
		initial: void 0,
		choices: [
			"upgrade",
			"downgrade",
			"override"
		]
	}),
	affects: new L.StringField({
		required: !0,
		choices: ["origin", "self"],
		initial: "self"
	})
}, R = {
	observed: 0,
	concealed: 1,
	hidden: 2,
	all: 3
}, nt = {
	downgrade: 30,
	upgrade: 40,
	override: 50
};
function rt() {
	class e extends game.pf2e.RuleElement {
		static validateJoint(e) {
			if (e.condition === e.treatAs) throw Error("condition can't be the same as treatAs");
			if (e.condition === "observed" && e.slug == null && e.slug === "") throw Error("slug is required when changing observed");
		}
		static defineSchema() {
			let e = super.defineSchema();
			return e.priority.initial = (e) => nt[String(e.mode)] ?? 50, {
				...e,
				...tt
			};
		}
		get tiebreakPriority() {
			let e = R[this.treatAs];
			return this.mode === "downgrade" ? -e : e;
		}
		getData(e) {
			return this.test(e) ? {
				slug: this.slug ?? "null",
				label: this.label,
				affects: this.affects,
				mode: this.mode,
				condition: this.condition,
				treatAs: this.treatAs,
				priority: this.tiebreakPriority
			} : null;
		}
	}
	return e;
}
//#endregion
//#region src/modules/flat/rules/common.ts
var z = {
	add: 20,
	downgrade: 30,
	upgrade: 40,
	override: 50
};
function it(e, t) {
	if (e.priority === t.priority) {
		if ("mode" in e && "mode" in t && e.mode !== t.mode) return z[e.mode] - z[t.mode];
		if (e.key === "fc-ModifyFlatDC" && t.key === "fc-ModifyFlatDC" && e.mode === "override") {
			let n = e.tiebreakPriority - t.tiebreakPriority;
			if (n) return n;
		}
		if (e.key === "fc-TreatAs" && t.key === "fc-TreatAs") {
			let n = e.tiebreakPriority - t.tiebreakPriority;
			if (n) return n;
		}
		return e.label.localeCompare(t.label);
	}
	return e.priority - t.priority;
}
var B = {
	"fc-ModifyFlatDC": "modify",
	"fc-AddCheck": "add",
	"fc-TreatAs": "map"
};
function at(e, t) {
	let n = Object.keys(B);
	return Me(e.rules, D((e) => n.includes(e.key)), D((e) => e.affects === t), We((e) => B[e.key]));
}
function V(e, t) {
	return [e, t].filter((e) => e != null).flat().sort(it);
}
var ot = class {
	modify;
	add;
	treatAs;
	constructor(e, t) {
		let n = e && at(e, "self"), r = t && at(t, "origin");
		this.modify = V(n?.modify, r?.modify), this.add = V(n?.add, r?.add), this.treatAs = V(n?.map, r?.map);
	}
	getDcAdjustment(e, t, n) {
		H(`fc-ModifyDC (${e})`, t);
		let r = this.modify.reduce((n, r) => {
			if (r.type === e) {
				let e = r.getData(t);
				e && n.push(e);
			}
			return n;
		}, []), i = n, a = [];
		for (let e of r) {
			let t = e.value;
			switch (e.mode) {
				case "add":
					if (t === 0) continue;
					i += t, a.push({
						label: e.label,
						value: `${t > 0 ? "+" : ""}${t}`
					});
					break;
				case "upgrade":
					i < t && (i = t, a = [{
						label: e.label,
						value: t.toString()
					}]);
					break;
				case "downgrade":
					i > t && (i = t, a = [{
						label: e.label,
						value: t.toString()
					}]);
					break;
				case "override":
					i = t, a = [{
						label: e.label,
						value: t.toString()
					}];
					break;
			}
		}
		return {
			finalDc: i,
			adjustments: a
		};
	}
	getTreatAsAdjustments(e, t) {
		if (!Object.keys(De).includes(e.type)) return null;
		let n = [t, I.forCheck(e)].flat();
		H(`fc-TreatAs (${e.type})`, n);
		let r = this.treatAs.map((e) => e.getData(n)).filter((e) => e != null), i = e.type, a = [];
		for (let e of r) e.condition !== "all" && e.condition !== i || e.condition !== "all" && (e.mode === "downgrade" && R[e.treatAs] > R[i] || e.mode === "upgrade" && R[e.treatAs] < R[i]) || (a.push({
			label: e.label,
			slug: e.slug,
			old: i,
			new: e.treatAs
		}), i = e.treatAs);
		return a.length ? a : null;
	}
	treatObservedAs(e) {
		let t = [e, I.forCheck({ type: "observed" })].flat();
		H("fc-TreatAs (observed)", t);
		let n = this.treatAs.map((e) => e.getData(t)).filter((e) => e?.condition === "observed").at(-1);
		return n ? {
			type: n.treatAs,
			conditionAdjustments: [{
				label: n.label,
				old: "observed",
				new: n.treatAs,
				slug: n.slug
			}],
			origin: {
				label: n.label,
				slug: n.slug
			}
		} : null;
	}
	getAdditionalSources(e) {
		H("fc-AddCheck", e);
		let t = [];
		for (let n of this.add) {
			let r = n.toSource(e);
			r && t.push(r);
		}
		return t;
	}
};
function H(e, t) {
	$.debug.re && console.log(`RollOptions for ${e} RE: `, t);
}
//#endregion
//#region src/modules/flat/visioner.ts
var st = new Map([
	"invisible",
	"undetected",
	"magical-darkness",
	"blinded",
	"darkness",
	"hidden",
	"dazzled",
	"dim-light",
	"concealed"
].map((e, t) => [e, t]));
async function ct(e, t) {
	let n = lt(e, t);
	if (n) return n;
	let r = await game.modules.get("pf2e-visioner")?.api.getVisibilityFactors(e.id, t.id);
	if (!r || r.state === "observed") return null;
	let i = O(r.slugs, [(e) => st.get(e) ?? Infinity, "asc"]), a = { type: r.state };
	return i && (a.origin = { slug: i }, r.reasons?.length && (a.origin.reasons = r.reasons)), a;
}
function lt(e, t) {
	let n = game.modules.get("pf2e-visioner")?.api;
	if (n) {
		let r = n.getVisibility(e.id, t.id);
		return r == null || r === "observed" || !(r in C) ? null : { type: r };
	}
	return null;
}
//#endregion
//#region src/modules/flat/target.ts
function ut(e, t) {
	let n = !1, r = !1;
	if (e?.isOfType("creature")) {
		if (n = e.hasDarkvision, n) return null;
		r = e.hasLowLightVision;
	}
	let i = P(t);
	return i === x.DARK && !n ? {
		origin: { slug: "darkness" },
		type: "hidden"
	} : i === x.DIM && !r ? {
		origin: { slug: "dim-light" },
		type: "concealed"
	} : null;
}
function dt() {
	if (canvas.tokens.controlled.length === 1) {
		let e = canvas.tokens.controlled[0];
		return e.actor?.isOfType("creature") ? e.document : null;
	} else if (canvas.tokens.controlled.length > 1) return null;
	if (game.user.isGM) return null;
	let e = null;
	for (let t of canvas.tokens.placeables) if (!(!t.actor?.isOwner || !t.actor?.isOfType("creature"))) {
		if (e) return null;
		e = t.document;
	}
	return e;
}
var ft = class e {
	origin;
	target;
	adjustments;
	rollOptions;
	constructor(e, t, n, r) {
		this.origin = e, this.target = t, this.adjustments = n, this.rollOptions = r;
	}
	static useVisionerAVS() {
		return typeof game.modules.get("pf2e-visioner")?.api?.getVisibilityFactors == "function" && game.settings.get("pf2e-visioner", "autoVisibilityEnabled");
	}
	#e() {
		let e = [];
		for (let t of ["blinded", "dazzled"]) this.origin?.actor?.conditions.bySlug(t).length && e.push({
			type: Oe[t],
			origin: { slug: t }
		});
		return e;
	}
	#t() {
		let e = [];
		for (let t of [
			"unnoticed",
			"undetected",
			"hidden",
			"concealed"
		]) this.target.actor?.conditions.bySlug(t).length && e.push({ type: t });
		return this.target.actor?.conditions.bySlug("invisible").length && e.push({
			type: "hidden",
			origin: { slug: "invisible" }
		}), e;
	}
	#n() {
		let e = [];
		if (this.origin && this.target) {
			let t = lt(this.origin, this.target);
			t && e.push(t);
		}
		if (this.origin?.actor && this.target.object && M.toSets().experimental.has("light-level") && ke.includes(this.origin.actor.type)) {
			let t = ut(this.origin?.actor ?? null, this.target.object);
			t && e.push(t), this.origin.level !== this.target.level && e.push({
				type: "unknown",
				origin: {
					slug: "scene-level",
					label: "층",
					warning: "warning.differentLevels"
				}
			});
		}
		return e;
	}
	#r() {
		let e = this.adjustments.treatObservedAs(this.rollOptions);
		return e ? [e] : [];
	}
	async #i() {
		let e = this.origin;
		if (!e) return [];
		let t = await ct(e, this.target);
		return t ? [t] : [];
	}
	async collectedSources() {
		if (M.toSets().ignored.has("target")) return [];
		let t = e.useVisionerAVS() ? [this.#i()] : [
			this.#e(),
			this.#t(),
			this.#n(),
			this.#r()
		], n = (await Promise.all(t)).flat(), r = [];
		for (let e of n) {
			let t = {
				...e,
				baseDc: C[e.type]
			}, n = this.adjustments.getTreatAsAdjustments(t, this.rollOptions), i = n?.at(-1);
			i?.new !== "observed" && (i && (t.type = i.new, t.conditionAdjustments = [t.conditionAdjustments ?? [], n].flat(), t.baseDc = C[t.type]), r.push(t));
		}
		return r;
	}
};
//#endregion
//#region src/modules/flat/data.ts
async function pt(e) {
	if (!e.author) return null;
	if (e.target?.token) return U.fromMessage(e, e.target.token);
	let t = game.user.targets.size ? [...game.user.targets].map((t) => U.fromMessage(e, t.document)) : [U.fromMessage(e)];
	if (t.length === 0) return null;
	if (t.length === 1) return t[0];
	let n = {}, r = 0;
	for (let e of t) for (let [t, i] of Object.entries(await e)) i.finalDc == null || i.finalDc <= 1 || (t === "target" ? r++ : (n[t]?.finalDc ?? 0) < i.finalDc && (n[t] = i));
	return r > 0 && (n.target = { targetCount: r }), n;
}
var U = class e {
	target;
	static fromMessage(t, n) {
		if (!t.actor) throw Error("Message has no actor");
		let r = t.target?.token;
		if (r && n && r !== n) throw Error(`fromMessage called with a target (${n.uuid}) that doesn't match the message's target (${r.uuid})`);
		return new e(t, r ?? n ?? null).calculateChecks();
	}
	static fromTokens(t, n) {
		return new e(t, n).calculateChecks();
	}
	adjustments;
	msg;
	token;
	actor;
	rollOptions;
	constructor(e, t) {
		if (this.target = t, e instanceof getDocumentClass("ChatMessage")) {
			if (this.msg = e, !e.token) throw Error("Message has no token");
			if (this.token = e.token, !this.token.actor) throw Error("Token has no actor");
			this.actor = this.token.actor;
		} else if (e instanceof getDocumentClass("Token")) {
			if (this.token = e, !this.token.actor) throw Error("Token has no actor");
			this.actor = this.token.actor;
		}
		let n = [];
		this.msg && (n = I.forRollMessage(this.msg)), n.length === 0 && (n = I.forMixed({
			msg: this.msg,
			origin: this.token,
			target: this.target ?? void 0
		})), n.push(...I.lightLevelOptions({
			msg: this.msg,
			self: this.token?.object,
			target: this.target?.object
		})), this.rollOptions = n, this.adjustments = new ot(this.actor ?? null, this.target?.actor ?? null);
	}
	#e() {
		let e = [], { ignored: t } = M.toSets();
		if (this.actor && this.msg && (!t.has("manipulate") && this.actor.conditions.stored.some((e) => e.slug === "grabbed") && this.msg.item?.system.traits.value?.some((e) => e === "manipulate") && e.push({
			type: "grabbed",
			origin: { slug: "manipulate" },
			baseDc: 5
		}), !t.has("deafened") && this.actor.conditions.stored.some((e) => e.slug === "deafened") && this.msg.item?.system.traits.value?.some((e) => e === "auditory") && e.push({
			type: "deafened",
			origin: { slug: "auditory" },
			baseDc: 5
		}), !t.has("deafened-spellcasting") && this.actor.conditions.stored.some((e) => e.slug === "deafened") && this.msg.flags?.[d.id]?.origin?.type === "spell" && !this.msg.item?.system.traits.value?.some((e) => e === "subtle") && e.push({
			type: "deafened",
			origin: { slug: "spell" },
			baseDc: 5
		}), !t.has("stupefied") && this.msg.flags?.[d.id]?.origin?.type === "spell")) {
			let t = this.actor.conditions.stupefied?.value;
			t && e.push({
				type: "stupefied",
				origin: { slug: "spell" },
				baseDc: 5 + t
			});
		}
		return e;
	}
	#t() {
		return this.target ? new ft(this.token, this.target, this.adjustments, this.rollOptions).collectedSources() : [];
	}
	#n() {
		return this.adjustments.getAdditionalSources(this.rollOptions);
	}
	async calculateChecks() {
		let e = { target: [] };
		for (let t of this.#e()) {
			let n = t.type;
			n in e ? e[n].push(t) : e[n] = [t];
		}
		for (let t of this.#n()) {
			let n = t.slot;
			n in e ? e[n].push(t) : e[n] = [t];
		}
		for (let t of await this.#t()) e.target.push(t);
		let t = {};
		for (let [n, r] of Object.entries(e)) {
			let e = this.#r(r);
			e && (t[n] = e, ["undetected", "unnoticed"].includes(e.type) && (e.secret = !0));
		}
		return t;
	}
	#r(e) {
		return Me(e, Ke((e) => {
			let t = [this.rollOptions, I.forCheck(e)].flat();
			if (e.baseDc == null) return {
				...e,
				finalDc: null
			};
			let { finalDc: n, adjustments: r } = this.adjustments.getDcAdjustment(e.type, t, e.baseDc);
			return {
				...e,
				finalDc: n,
				dcAdjustments: r
			};
		}), O([(e) => e.finalDc ?? Infinity, "desc"]));
	}
};
//#endregion
//#region src/modules/flat/i18n.ts
function mt(e) {
	let t = e.capitalize();
	for (let n of [
		`PF2E.ConditionType${t}`,
		`PF2E.Trait${t}`,
		`pf2e-fc.common.${e}`
	]) {
		let e = gt(n);
		if (e) return e;
	}
	return _t(e);
}
function ht(e) {
	return gt(`pf2e-fc.flat.source.${e.slug}`) || (e.label ?? _t(e.slug));
}
function gt(e) {
	let t = game.i18n.localize(e);
	return t === e ? null : t;
}
function _t(e) {
	return e.replace(/\w\S*/g, (e) => e.charAt(0).toUpperCase() + e.substring(1).toLowerCase());
}
//#endregion
//#region src/modules/flat/message.ts
var vt = class extends a {
	settingsKey = "flat-check-in-message";
	enable() {
		game.modules.get("lib-wrapper")?.active && (super.enable(), this.registerWrapper("ChatMessage.prototype._preCreate", bt, "WRAPPER"), this.registerWrapper("ChatMessage.prototype.renderHTML", xt, "WRAPPER"), this.registerChatAction("fc-reveal-hidden-message", jt), N.enable());
	}
	disable() {
		super.disable();
	}
}, yt = {
	hero: "fa-solid fa-hospital-symbol",
	new: "fa-solid fa-dice",
	low: "fa-solid fa-dice-one",
	high: "fa-solid fa-dice-six"
};
async function bt(e, ...t) {
	let n = await e(...t);
	try {
		if (await Tt(this) === !1) return !1;
	} catch (e) {
		console.error("Exception occured in message _preCreate wrapper: ", e);
	}
	return n;
}
async function xt(e, ...t) {
	let n = await e(...t);
	try {
		this.isContentVisible && (this.flags["pf2e-flatcheck-helper"]?.hiddenMsg != null && Ct(this, n), await St(this, n));
	} catch (e) {
		console.error("Exception occured while rendering message flat-check buttons: ", e);
	}
	return n;
}
async function St(t, n) {
	function r(e, n) {
		let r = [], i = [n.reroll?.oldRoll, n.roll], a = ["strikethrough", "strikethrough"];
		if (n.finalDc == null) a = ["", ""], n.reroll?.keep && ["hero", "new"].includes(n.reroll?.keep) && (a[0] = "strikethrough");
		else if (n.reroll?.keep === "high") {
			let e = +(n.reroll.oldRoll < n.roll), t = i[e] >= n.finalDc ? "success" : "failure";
			a[e] = t;
		} else if (n.reroll?.keep === "low") {
			let e = +(n.reroll.oldRoll > n.roll), t = i[e] >= n.finalDc ? "success" : "failure";
			a[e] = t;
		} else {
			let e = n.roll ? n.roll >= n.finalDc ? "success" : "failure" : "";
			a[1] = e;
		}
		n.reroll?.oldRoll && r.push({
			class: a[0],
			value: n.reroll.oldRoll
		}), n.roll && r.push({
			class: a[1],
			value: n.roll
		});
		let o = "hide";
		n.finalDc != null && n.finalDc <= 1 ? o = "auto" : n.finalDc != null && n.finalDc >= 20 ? o = "impossible" : t.canUserModify(game.user, "update") && !n.reroll && (o = "show");
		let s = n.secret && (game.user.isGM ? "gm" : "hide");
		return s && !t.hasPlayerOwner && game.user.isGM && (o = "gm-only"), {
			key: e,
			baseDc: n.baseDc,
			finalDc: n.finalDc,
			dcAdjustments: n.dcAdjustments?.map((e) => `${e.label}: ${e.value}`).join("<br>"),
			type: n.type,
			reasons: n.origin?.reasons,
			conditionAdjustments: n.conditionAdjustments,
			warning: n.origin?.warning,
			origin: n.origin,
			rolls: r,
			rerollIcon: n.reroll?.keep ? yt[n.reroll?.keep] : void 0,
			secret: s,
			rollButton: o
		};
	}
	function i(e, t) {
		return {
			icon: "fa-solid fa-circle-question",
			text: u("flat.message.button-require-flat-check", { count: t.targetCount })
		};
	}
	if (t.flags["pf2e-toolbelt"]?.targetHelper?.type === "check") return;
	let a = t.flags[e]?.flatchecks;
	if (!a) return;
	let o = [], s = [];
	for (let [e, t] of Object.entries(a)) "type" in t ? o.push(r(e, t)) : "targetCount" in t && s.push(i(e, t));
	if (o.length || s.length) {
		let e = {
			buttons: o,
			notes: s,
			i18n: (e) => u(`flat.${e}`),
			localizeType: mt,
			localizeOrigin: ht
		}, r = l(await foundry.applications.handlebars.renderTemplate("modules/pf2e-flatcheck-helper/templates/flat-check-buttons.hbs", e));
		if (a.grabbed && a.stupefied) {
			let e = l(`<div class="fc-rule-note">
					<span data-tooltip='"${u("flat.message.tooltip-highest-dc")}"'><i class="fa-solid fa-circle-info"></i></span>
				</div>`);
			r.append(e);
		}
		(() => {
			let e = n.querySelector("section.card-buttons");
			if (e) {
				e.append(r);
				return;
			}
			if (e = [...n.querySelectorAll("div.dice-roll")].at(-1), e) {
				e.after(r);
				return;
			}
			if (e = n.querySelector("footer"), e) {
				e.before(r);
				return;
			}
			if (e = n.querySelector("div.message-buttons"), e) {
				e.before(r);
				return;
			}
			if (e = n.querySelector("div.message-content"), e) {
				e.append(r);
				return;
			}
			console.error("Could not insert flat check buttons into message.", t);
		})(), n.addEventListener("click", (e) => {
			let n = e.target;
			if (n instanceof HTMLElement && n.matches("button[data-action=\"roll-flatcheck\"]")) {
				let e = n.dataset.key;
				At(t, e, Number(n.dataset.dc));
			}
		});
	}
}
function Ct(e, t) {
	let n = game.user.isGM || $.settings.flatPlayersCanReveal, r = l(`
		<div class="message-buttons">
			<button type="button" data-action="fc-reveal-hidden-message" ${n ? "" : "disabled"} ${n ? "" : `data-tooltip="${u("flat.message.hide.disabled-tooltip")}"`}>${u("flat.message.hide.reveal-button")}</button>
		</div>`);
	t.querySelector(".fc-dice-placeholder")?.after(r);
}
function wt(e) {
	let t = e.flags?.[d.id]?.context?.type;
	if (t && [
		"damage-roll",
		"damage-taken",
		"flat-check",
		"initiative",
		"saving-throw"
	].includes(t)) return !1;
	if (t === "spell-cast") return e.item.isAttack === e.isRoll;
	let n = e.flags?.[d.id]?.context;
	return e.isRoll ? !!n && "dc" in n : e.item ? e.item.isOfType("action", "consumable", "equipment", "feat", "melee", "spell", "weapon") : !1;
}
async function Tt(t) {
	if (!t.actor || !wt(t) || t.flags["pf2e-flatcheck-helper"]?.revealed) {
		t.isRoll && game.modules.get("xdy-pf2e-workbench")?.active && t.updateSource({ "flags.xdy-pf2e-workbench.noAutoDamageRoll": !0 });
		return;
	}
	let n = await pt(t);
	if (n != null && Object.keys(n).length) {
		if (t.updateSource({ [`flags.${e}.flatchecks`]: n }), $.settings.flatAutoRoll && !t.isReroll) {
			let e = await Et(t);
			t.updateSource(e);
		}
		let r = Dt(t);
		if ($.settings.flatHideRoll && ke.includes(t.actor.type) && (!$.settings.flatAutoReveal || !r) && t.isCheckRoll && !t.isReroll) {
			let n = l(t.flavor);
			for (let e of ["div.result.degree-of-success", "ul.notes"]) n.querySelector(e)?.remove();
			let r = new XMLSerializer().serializeToString(n);
			return getDocumentClass("ChatMessage").create({
				author: t.author?.id,
				speaker: t.speaker,
				sound: $.settings.flatAutoRoll ? CONFIG.sounds.dice : CONFIG.sounds.lock,
				content: `
				<div class="message-header fc-hidden-roll">
					<span class="flavor-text">
						${r}
					</span>
				</div>
				<h4 class="fc-dice-placeholder">
					<i class="fa-solid fa-eye-slash"></i>
				</h4>
			`,
				flags: {
					[e]: {
						hiddenMsg: t.toJSON(),
						flatchecks: t.flags[e].flatchecks
					},
					"xdy-pf2e-workbench": { noAutoDamageRoll: !0 }
				}
			}), !1;
		}
		!r && game.modules.get("xdy-pf2e-workbench")?.active && t.updateSource({ "flags.xdy-pf2e-workbench.noAutoDamageRoll": !0 });
	}
}
async function Et(t) {
	let n = t.flags[e]?.flatchecks;
	if (!n) return;
	let r = {};
	for (let [i, a] of Object.entries(n)) {
		if (!("finalDc" in a) || a.finalDc == null || a.finalDc <= 1 || a.finalDc >= 20) continue;
		let n = await new Roll("1d20").roll();
		t.rolls.push(n), r[`flags.${e}.flatchecks.${i}.roll`] = n.total, kt({
			msgId: t.id,
			userId: game.user.id,
			rolls: JSON.stringify([n])
		}), await Ot(t, a, n.total, !!a?.reroll);
	}
	return r;
}
function Dt(t, n = !0) {
	let r = t.flags[e]?.flatchecks;
	if (r == null || Object.keys(r).length === 0) return n;
	for (let e of Object.values(r)) {
		if (!("finalDc" in e)) continue;
		if (e.finalDc == null || e.finalDc >= 20) return !1;
		if (e.finalDc <= 1) continue;
		if (e.secret && (t.hasPlayerOwner || !game.user.isGM)) return !1;
		let n = e.roll;
		if (n == null) return !1;
		if (e.reroll) {
			let t = e.reroll.keep, r = e.reroll.oldRoll;
			t === "low" ? n = Math.min(r, n) : t === "high" && (n = Math.max(r, n));
		}
		if (n < e.finalDc) return !1;
	}
	return !0;
}
async function Ot(e, t, n, r) {
	if (!game.toolbelt || !t || !game.settings.get("pf2e-toolbelt", "rollTracker.enabled")) return;
	let i = t.finalDc == null ? void 0 : n >= t.finalDc ? "success" : "failure", a = game.settings.get("pf2e-toolbelt", "rollTracker.userRolls").slice();
	a.push({
		value: n,
		time: Date.now(),
		type: "flat-check",
		isPrivate: !!t.secret,
		isReroll: r,
		actor: e.actor?.id,
		encounter: game.combat?.id,
		session: game.settings.get("pf2e-toolbelt", "rollTracker.session"),
		outcome: i,
		modifier: "flat"
	}), await game.settings.set("pf2e-toolbelt", "rollTracker.userRolls", a);
}
function kt(e) {
	if (!game.dice3d) return;
	let t = game.users.get(e.userId);
	if (t) for (let n of JSON.parse(e.rolls)) {
		let r = Roll.fromData(n);
		game.dice3d.showForRoll(r, t, !0, null, !1, e.msgId);
	}
}
async function At(t, n, r) {
	let i = await new Roll("d20").roll(), a = foundry.utils.getProperty(t, `flags.${e}.flatchecks.${n}.roll`), o = foundry.utils.getProperty(t, `flags.${e}.flatchecks.${n}`), s = {};
	if (!a) s[`flags.${e}.flatchecks.${n}.roll`] = i.total;
	else {
		let r = 0;
		t.actor?.isOfType("character") && (r = t.actor?.system.resources.heroPoints.value), await foundry.applications.api.DialogV2.wait({
			id: `${e}.flatcheck.reroll`,
			window: { title: "PF2e Utility Buttons" },
			content: `
				${r > 0 ? `<label><input type="radio" name="choice" value="hero" checked> <i class="fa-solid fa-hospital-symbol"></i> ${u("flat.message.reroll-hero-point")}</label>` : ""}
				<label><input type="radio" name="choice" value="new" ${r <= 0 ? "checked" : ""}> <i class="fa-solid fa-dice"></i> ${u("flat.message.reroll-new-result")}</label>
				<label><input type="radio" name="choice" value="low"> <i class="fa-solid fa-dice-one"></i> ${u("flat.message.reroll-lower-result")}</label>
				<label><input type="radio" name="choice" value="high"> <i class="fa-solid fa-dice-six"></i> ${u("flat.message.reroll-higher-result")}</label>
			`,
			buttons: [{
				action: "submit",
				icon: "fa-solid fa-rotate rotate",
				label: u("flat.message.button-reroll"),
				default: !0,
				callback: (e, t, n) => t.form.elements.choice.value
			}, {
				action: "cancel",
				icon: "fas fa-times",
				label: u("flat.message.button-cancel")
			}],
			submit: async (r) => {
				if (r !== "cancel") {
					if (r === "hero" && t.actor?.isOfType("character")) {
						let { value: e, max: n } = t.actor.system.resources.heroPoints;
						await t.actor?.update({ "system.resources.heroPoints.value": Math.clamp(e - 1, 0, n) });
					}
					s[`flags.${e}.flatchecks.${n}.roll`] = i.total, s[`flags.${e}.flatchecks.${n}.reroll`] = {
						oldRoll: a,
						keep: r
					};
				}
			}
		});
	}
	Object.keys(s).length > 0 && (t.rolls.push(i), kt({
		msgId: t.id,
		userId: game.user.id,
		rolls: JSON.stringify([i.toJSON()])
	}), await Ot(t, o, i.total, !!a), await t.update(s), $.settings.flatAutoReveal && Dt(t) && Mt(t));
}
async function jt(e) {
	await Mt(e);
}
async function Mt(t) {
	let n = t.flags[e].hiddenMsg;
	n && (n.flags[e].revealed = !0, n.flags[e].flatchecks = t.flags[e].flatchecks, await getDocumentClass("ChatMessage").create(n), await t.delete());
}
//#endregion
//#region src/modules/flat/rules/fields.ts
var Nt = class extends foundry.data.fields.DataField {
	_validateType(e, t) {
		return typeof e == "string" || typeof e == "number";
	}
	_cleanType(e, t) {
		if (typeof e == "number") return e;
		let n = e.trim(), r = Number.parseInt(n, 10);
		return Number.isNaN(r) ? n : r;
	}
}, W = foundry.data.fields, Pt = {
	type: new W.StringField({
		required: !0,
		blank: !1
	}),
	slot: new W.StringField({
		required: !1,
		blank: !1
	}),
	baseDC: new Nt({ required: !0 }),
	affects: new W.StringField({
		required: !0,
		choices: ["origin", "self"],
		initial: "self"
	})
};
function Ft() {
	class e extends game.pf2e.RuleElement {
		static defineSchema() {
			let e = super.defineSchema();
			return e.slug.required = !0, e.slug.nullable = !1, {
				...e,
				...Pt
			};
		}
		toSource(e) {
			if (!this.test(e)) return null;
			let t = this.resolveValue(this.baseDC);
			return typeof t == "number" ? {
				type: this.type,
				origin: {
					slug: this.slug,
					label: this.label
				},
				slot: this.slot ?? this.slug,
				baseDc: t
			} : null;
		}
	}
	return e;
}
//#endregion
//#region src/modules/flat/rules/modify.ts
var G = foundry.data.fields, It = {
	type: new G.StringField({
		required: !0,
		blank: !1
	}),
	mode: new G.StringField({
		required: !0,
		blank: !1,
		choices: [
			"add",
			"upgrade",
			"downgrade",
			"override"
		]
	}),
	value: new Nt({ required: !0 }),
	affects: new G.StringField({
		required: !0,
		choices: ["origin", "self"],
		initial: "self"
	})
};
function Lt() {
	class e extends game.pf2e.RuleElement {
		static defineSchema() {
			let e = super.defineSchema();
			return e.priority.initial = (e) => z[String(e.mode)] ?? z.override, {
				...e,
				...It
			};
		}
		get tiebreakPriority() {
			return this.resolvedValue;
		}
		get resolvedValue() {
			let e = this.resolveValue(this.value, NaN);
			return Number.isNumeric(e) ? Number(e) : NaN;
		}
		getData(e) {
			if (!this.test(e)) return null;
			let t = this.resolvedValue;
			if (Number.isNaN(t)) return null;
			let n = {
				label: this.label,
				type: this.resolveInjectedProperties(this.type),
				mode: this.mode,
				value: t,
				affects: this.affects
			};
			return this.ignored ? null : n;
		}
	}
	return e;
}
//#endregion
//#region src/modules/flat/rules/setup.ts
function Rt() {
	game.pf2e.RuleElements.custom["fc-ModifyFlatDC"] = Lt(), game.pf2e.RuleElements.custom["fc-AddCheck"] = Ft(), game.pf2e.RuleElements.custom["fc-TreatAs"] = rt();
}
//#endregion
//#region src/modules/flat/target-marker.ts
function zt(e, t = 0) {
	let n = e.scene.grid.size, r = Math.max(1, Math.ceil(Math.min(e.bounds.width, e.bounds.height) / n));
	return n / 100 + t * r;
}
var K = {
	tokenMap: /* @__PURE__ */ new Map(),
	getOrCreate(e) {
		if (this.tokenMap.has(e.id)) return this.tokenMap.get(e.id);
		let t = new Ht(e);
		return this.tokenMap.set(e.id, t), t;
	},
	target(e) {
		this.getOrCreate(e).draw();
	},
	untarget(e) {
		this.tokenMap.get(e.id)?.destroy(), this.tokenMap.delete(e.id);
	},
	refreshToken(e) {
		this.tokenMap.get(e.id)?.draw();
	},
	destroyAll() {
		for (let [e, t] of this.tokenMap.entries()) t.destroy();
	},
	refreshTargets() {
		for (let e of game.user.targets) this.target(e);
	},
	debouncedRefresh: foundry.utils.debounce(() => {
		K.refreshTargets();
	}, 100)
}, Bt = {
	align: "center",
	dropShadow: !1,
	strokeThickness: 2
}, Vt = {
	normal: (e) => foundry.canvas.containers.PreciseText.getTextStyle({
		fontSize: 14 * e,
		...Bt
	}),
	small: (e) => foundry.canvas.containers.PreciseText.getTextStyle({
		fontSize: 12 * e,
		fill: "#eeeeee",
		...Bt
	})
}, Ht = class {
	token;
	#e;
	#t;
	constructor(e) {
		this.token = e, this.#e = new PIXI.Container(), this.#e.alpha = .9;
		let t = zt(e, .5);
		this.#t = foundry.canvas.rendering.filters.OutlineOverlayFilter.create({
			knockout: !1,
			wave: !1
		}), this.#t.thickness = 3 * t, this.#t.animated = !1, this.token.addChild(this.#e), this.token.mesh?.filters?.unshift(this.#t);
	}
	async draw() {
		this.#e.removeChildren(), this.#t.enabled = !1;
		let e = dt(), t = (await U.fromTokens(e, this.token.document)).target;
		if (!(!t || t.finalDc != null && t.finalDc <= 1 || $.settings.flatTargetMarkerMode === "onlyWithOrigin" && e == null)) {
			if ($.settings.flatTargetMarkerDisplay.outline) {
				let e = Ce.fromDC(t.finalDc);
				this.#t.uniforms.outlineColor = e.toArray(), this.#t.enabled = !0;
			}
			if ($.settings.flatTargetMarkerDisplay.text) {
				let e = zt(this.token, .5), n = new foundry.canvas.containers.PreciseText(u("flat.target-marker-dc", {
					dc: t.finalDc ?? "?",
					label: mt(t.type)
				}), Vt.normal(e));
				if (n.x = this.token.bounds.width / 2 - n.width / 2, n.y = this.token.bounds.height * .95 - n.height, this.#e.addChild(n), t.origin && t.type !== t.origin.slug) {
					let r = new foundry.canvas.containers.PreciseText(ht(t.origin), Vt.small(e));
					r.x = this.token.bounds.width / 2 - r.width / 2, r.y = n.y - r.height * .75, this.#e.addChild(r);
				}
			}
		}
	}
	destroy() {
		this.#e.destroy();
		let e = this.token.mesh?.filters?.indexOf(this.#t);
		e !== void 0 && e > -1 && this.token.mesh?.filters?.splice(e, 1);
	}
}, Ut = class extends a {
	settingsKey = "flat-check-target-marker";
	hasSettingEnabled() {
		return game.settings.get(e, this.settingsKey) !== "disabled";
	}
	enable() {
		this.registerHook("targetToken", (e, t, n) => {
			e === game.user && (n ? K.target(t) : K.untarget(t));
		}), this.registerHook("controlToken", () => {
			K.debouncedRefresh();
		});
		let e = /* @__PURE__ */ new Map();
		this.registerHook("refreshToken", (t, n) => {
			if (!(n.refreshPosition && n.refreshVisibility)) return;
			e.has(t.id) && clearTimeout(e.get(t.id));
			let r = setTimeout(() => {
				e.delete(t.id), K.refreshToken(t);
			}, 100);
			e.set(t.id, r);
		}), this.registerHook("canvasTearDown", () => {
			K.destroyAll();
		}), this.registerHook("lightingRefresh", () => {
			K.debouncedRefresh();
		}), N.enable();
	}
	disable() {
		super.disable(), K.destroyAll();
	}
}, Wt = class extends a {
	settingsKey = "lifelink";
	enable() {
		super.enable(), this.registerHook("pf2e.startTurn", Jt), this.registerHook("createItem", Yt), this.registerHook("createChatMessage", Xt), this.registerHook("renderChatMessageHTML", Zt);
	}
}, Gt = "<button type=\"button\" class=\"fc-undo-button\" data-tooltip=\"PF2E.RevertDamage.ButtonTooltip\" data-tooltip-direction=\"UP\"><i class=\"fa-solid fa-rotate-left\"></i></button>";
function q(e, t) {
	return `
  <a class="content-link life-link" data-args='${JSON.stringify(t)}'>
    <i class="fa-solid fa-heart-pulse"></i>
    ${e}
  </a>
  `;
}
async function J(e, t) {
	let n = e.system.attributes.hp.value;
	await e.update({ "system.attributes.hp.value": n + t });
}
async function Kt(t) {
	for (let e of ["source", "target"]) if (!(e in t)) return ui.notifications.error(`Missing arg ${e}`);
	let n = fromUuidSync(t.source), r = fromUuidSync(t.target);
	if (!r) return ui.notifications.error(u("life-link.error-no-target"));
	if (!n) return ui.notifications.error(u("life-link.error-no-source"));
	if (n.id === r.id) return ui.notifications.error(u("life-link.error-source-is-target"));
	let i = 0;
	if (t.transfer) {
		let e = r.system.attributes.hp.max - r.system.attributes.hp.value, a = Math.min(Number(t.transfer), e), o = n.system.attributes.hp.value;
		if (i = Math.min(a, o), i <= 0) return ui.notifications.warn(u("life-link.no-hp-remaining"));
	}
	let a = i, o = i;
	i < n.system.attributes.hp.value && (a += t.heal ?? 0, o += t.dmg ?? 0), await J(n, -o), await J(r, a), t.cd && await r.createEmbeddedDocuments("Item", [{
		type: "effect",
		name: u("life-link.life-link-cooldown-effect"),
		img: d.filePath("icons/spells/life-link.webp"),
		system: {
			tokenIcon: { show: !0 },
			duration: {
				value: 1,
				unit: "rounds",
				sustained: !1,
				expiry: "turn-start"
			},
			slug: "life-link-cd"
		}
	}]), await ChatMessage.create({
		content: `<span class="undo-text">
    <span style="background-color: rgba(0,255,0,0.2);padding: 1px 3px;">${u("life-link.hp-add", {
			actor: String(r.name),
			hp: a
		})}</span>
    🡰
    <span style="background-color: rgba(255,0,0,0.2);padding: 1px 3px;">${u("life-link.hp-sub", {
			actor: String(n.name),
			hp: o
		})}</span>
    </span>
    ${Gt}
    `,
		flags: { [e]: { undo: [[n.uuid, o], [r.uuid, -a]] } }
	});
}
function qt(e) {
	let { actor: t, origin: n } = e;
	if (!t) return null;
	if (!n || n.id === t.id) return ui.notifications.error(u("life-link.spirit-link-error-bad-actor", { actor: t.name })), null;
	let r = e.level * 2;
	return t.system.attributes.hp.max - t.system.attributes.hp.value <= 0 ? null : q(u("life-link.spirit-link-button", {
		hp: r,
		actor: t.name
	}), {
		transfer: r,
		source: n.uuid,
		target: t.uuid
	});
}
async function Jt(e) {
	if (game?.users?.activeGM?.id !== game.user?.id) return;
	let t = [];
	canvas.scene?.tokens.forEach(({ actor: n }) => {
		if (!n) return;
		let r = o(n, "spirit-linked");
		if (!r || e.actor?.id !== r.origin?.id) return;
		let i = qt(r);
		i && t.push(i);
	});
	let n = u("life-link.spirit-link-message", { link: t.join("<br>") });
	t.length && await ChatMessage.create({
		content: n,
		whisper: ChatMessage.getWhisperRecipients("GM").map((e) => e.id),
		speaker: ChatMessage.getSpeaker({ actor: e.actor })
	});
}
async function Yt(e) {
	if (e.isOfType("effect") && e.slug === "spirit-linked") {
		let t = qt(e);
		t && await ChatMessage.create({
			content: u("life-link.spirit-link-message", { link: t }),
			whisper: ChatMessage.getWhisperRecipients("GM").map((e) => e.id),
			speaker: ChatMessage.getSpeaker({ actor: e.actor })
		});
	}
}
async function Xt(e) {
	if (game.users?.activeGM?.id !== game.user?.id) return;
	let t = e.flags?.[d.id]?.appliedDamage, n = t?.uuid, r = t?.updates.find((e) => e.path === "system.attributes.hp.value")?.value;
	if (!n || !r || r <= 0) return;
	let i = fromUuidSync(n);
	if (!i) return;
	let a = 0, c = o(i, "life-linked");
	c && !s(i, "life-link-cd") && (a = (() => {
		if (!c.origin || c.origin.id === i.id) return ui.notifications.error(u("life-link.life-link-error-bad-actor", { actor: i.name }), { permanent: !0 }), 0;
		let e = 3;
		return $.settings.lifeLinkVariant === "plus" ? e = 2 + Math.floor((c.level - 1) / 2) * 3 : (c.level >= 3 && (e = 5), c.level >= 6 && (e = 10), c.level >= 9 && (e = 15)), Math.min(e, r);
	})());
	let l = o(i, "share-life");
	l && !l?.origin && ui.notifications.error(u("life-link.share-life-error-bad-actor", { actor: i.name }), { permanent: !0 });
	let f = [];
	(() => {
		if (l && a) {
			let e = r - a;
			if (l?.origin && c?.origin && l.origin.uuid === c.origin.uuid) {
				f.push(q(u("life-link.damage-button", {
					damage: Math.ceil(e / 2) + a,
					actor: c.origin.name
				}), {
					transfer: a,
					heal: e === 1 ? 1 : Math.ceil(e / 2),
					dmg: Math.ceil(e / 2),
					cd: 1,
					source: c.origin.uuid,
					target: i.uuid
				}));
				return;
			}
		}
		if (l?.origin) {
			let e = r - a;
			e && f.push(q(u("life-link.share-life-damage-button", {
				damage: Math.ceil(e / 2),
				actor: l.origin.name
			}), {
				heal: e === 1 ? 1 : Math.ceil(e / 2),
				dmg: Math.ceil(e / 2),
				source: l.origin.uuid,
				target: i.uuid
			}));
		}
		c?.origin && a && f.push(q(u("life-link.life-link-damage-button", {
			damage: a,
			actor: c.origin.name
		}), {
			transfer: a,
			cd: 1,
			source: c.origin.uuid,
			target: i.uuid
		}));
	})(), f.length && await ChatMessage.create({
		content: u("life-link.damage-transfer-message", { buttons: f.join("<br>") }),
		whisper: ChatMessage.getWhisperRecipients("GM").map((e) => e.id),
		speaker: ChatMessage.getSpeaker(i)
	});
}
function Zt(t, n) {
	game.user?.isGM && (n.querySelector("a.life-link")?.addEventListener("click", async (e) => {
		e.target instanceof HTMLElement && await Kt(JSON.parse(e.target.dataset.args));
	}), n.querySelector("button.fc-undo-button")?.addEventListener("click", async () => {
		let r = t.flags[e]?.undo;
		for (let [e, t] of r) await J(await fromUuid(e), t);
		n.querySelector(".undo-text")?.classList.add("undo"), await t.update({ content: n.querySelector(".message-content")?.innerHTML });
	}));
}
//#endregion
//#region src/modules/misc/alt-roll-breakdown.ts
var Qt = class extends a {
	settingsKey = "script-alt-roll-breakdown";
	enable() {
		super.enable(), this.registerHook("renderChatMessageHTML", en);
	}
	onReady() {
		tn();
	}
};
function $t(e) {
	return !game.settings.get(d.id, "metagame_showBreakdowns") && e.author?.isGM && !e.actor?.hasPlayerOwner && e.isRoll;
}
async function en(e, t) {
	if (!$t(e)) return;
	let n = e.flags[d.id].modifiers;
	if (!n) return;
	let r = n.filter((e) => e.type && [
		"untyped",
		"circumstance",
		"status"
	].includes(e.type) && e.slug !== "base" && e.enabled);
	for (let e of r) t.querySelector(`span.flavor-text span.tag[data-slug="${e.slug}"]`)?.removeAttribute("data-visibility");
}
function tn() {
	!game.user.isGM || !game.settings.get(d.id, "metagame_showBreakdowns") || new foundry.applications.api.DialogV2({
		window: { title: "PF2e Utility Buttons - 대체 굴림 내역" },
		content: "\n     <p>대체 굴림 내역을 사용하려면 \"굴림 내역 표시\" 시스템 메타게임 설정을 비활성화해야 합니다.</p>\n    ",
		buttons: [{
			action: "disable",
			label: "대체 굴림 내역 비활성화",
			callback: () => game.settings.set(e, "script-alt-roll-breakdown", !1)
		}, {
			action: "enable",
			label: "시스템 설정 비활성화",
			default: !0,
			callback: () => game.settings.set(d.id, "metagame_showBreakdowns", !1)
		}],
		submit: void 0
	}).render({ force: !0 });
}
//#endregion
//#region src/modules/misc/toggle-vision.ts
var nn = class extends a {
	settingsKey = "script-toggle-shared-vision";
	enable() {
		super.enable(), this.registerHook("updateSetting", rn), this.registerHook("combatStart", an), this.registerHook("deleteCombat", on);
	}
	onReady() {
		game.users.activeGM === game.user && game.settings.set(d.id, "metagame_partyVision", !game.combat?.started);
	}
};
function rn(e) {
	if (!(game.user.isGM || e.key !== `${d.id}.metagame_partyVision`)) {
		for (let e of canvas.tokens.placeables) !e.vision === e._isVisionSource() && e.initializeVisionSource();
		canvas.perception.update({
			refreshVision: !0,
			refreshSounds: !0,
			refreshOcclusion: canvas.tokens.occlusionMode & CONST.TOKEN_OCCLUSION_MODES.CONTROLLED
		});
	}
}
function an() {
	game.users.activeGM === game.user && game.settings.set(d.id, "metagame_partyVision", !1);
}
function on() {
	game.users.activeGM === game.user && game.settings.set(d.id, "metagame_partyVision", !0);
}
//#endregion
//#region src/settings.ts
var Y = {}, sn = {
	get delayShouldPrompt() {
		return game.settings.get(e, "delay-prompt");
	},
	get allowReturn() {
		return game.settings.get(e, "delay-return");
	},
	get delayCreateMessage() {
		return game.settings.get(e, "delay-create-message");
	},
	get showInCombatTracker() {
		return game.settings.get(e, "delay-combat-tracker");
	},
	get showInTokenHUD() {
		return game.settings.get(e, "delay-token-hud");
	},
	get modifyPF2eHud() {
		return game.settings.get(e, "pf2e-hud-enable");
	},
	get removeCombatToggle() {
		return game.settings.get(e, "token-hud-remove-combat-toggle");
	},
	get delayCreatesMessage() {
		return game.settings.get(e, "delay-create-message");
	},
	get flatAutoRoll() {
		let t = game.settings.get(e, "flat-check-auto-roll");
		return t === "always" ? !0 : t === "never" ? !1 : game.settings.get(e, "flat-check-auto-roll-user");
	},
	get flatHideRoll() {
		return game.settings.get(e, "flat-check-hide-roll");
	},
	get flatAutoReveal() {
		return game.settings.get(e, "flat-check-hide-roll-auto-reveal");
	},
	get flatPlayersCanReveal() {
		return game.settings.get(e, "flat-check-hide-roll-players-can-reveal");
	},
	get flatTargetMarkerMode() {
		return game.settings.get(e, "flat-check-target-marker");
	},
	get flatTargetMarkerDisplay() {
		let t = game.settings.get(e, "flat-check-target-marker-display");
		return {
			text: t === "all" || t === "textOnly",
			outline: t === "all" || t === "outlineOnly"
		};
	},
	get lifeLinkEnabled() {
		return game.settings.get(e, "lifelink");
	},
	get lifeLinkVariant() {
		return game.settings.get(e, "lifelink-formular");
	},
	get emanationAutomation() {
		return game.modules.get("lib-wrapper")?.active && game.settings.get("pf2e-flatcheck-helper", "emanation-automation");
	},
	get altRollBreakdown() {
		return game.settings.get(e, "script-alt-roll-breakdown");
	},
	get toggleSharedVision() {
		return game.settings.get(e, "script-toggle-shared-vision");
	},
	get flags() {
		return X;
	},
	init() {
		Z("flat-check-in-message", {
			name: "pf2e-fc.settings.flat-check-in-message.name",
			hint: "pf2e-fc.settings.flat-check-in-message.hint",
			scope: "world",
			config: !0,
			default: !0,
			type: Boolean,
			requiresReload: !0,
			flags: { requiresLibwrapper: !0 }
		}), Z("flat-check-config", {
			name: "pf2e-fc.settings.flat-check-config.name",
			hint: "",
			scope: "world",
			config: !0,
			default: {},
			type: Object
		}), Z("flat-check-auto-roll", {
			name: "pf2e-fc.settings.flat-check-auto-roll.name",
			hint: "pf2e-fc.settings.flat-check-auto-roll.hint",
			scope: "world",
			config: !0,
			default: "user",
			choices: {
				always: "pf2e-fc.settings.flat-check-auto-roll.choices.always",
				user: "pf2e-fc.settings.flat-check-auto-roll.choices.user",
				never: "pf2e-fc.settings.flat-check-auto-roll.choices.never"
			},
			type: String
		}), Z("flat-check-auto-roll-user", {
			name: "pf2e-fc.settings.flat-check-auto-roll-user.name",
			hint: "pf2e-fc.settings.flat-check-auto-roll-user.hint",
			scope: "user",
			config: !0,
			default: !1,
			type: Boolean
		}), Z("flat-check-hide-roll", {
			name: "pf2e-fc.settings.flat-check-hide-roll.name",
			hint: "pf2e-fc.settings.flat-check-hide-roll.hint",
			scope: "world",
			config: !0,
			default: !1,
			type: Boolean
		}), Z("flat-check-hide-roll-auto-reveal", {
			name: "pf2e-fc.settings.flat-check-hide-roll-auto-reveal.name",
			hint: "pf2e-fc.settings.flat-check-hide-roll-auto-reveal.hint",
			scope: "world",
			config: !0,
			default: !0,
			type: Boolean
		}), Z("flat-check-hide-roll-players-can-reveal", {
			name: "pf2e-fc.settings.flat-check-hide-roll-players-can-reveal.name",
			hint: "pf2e-fc.settings.flat-check-hide-roll-players-can-reveal.hint",
			scope: "world",
			config: !0,
			default: !1,
			type: Boolean
		}), Z("flat-check-target-marker", {
			name: "pf2e-fc.settings.flat-check-target-marker.name",
			hint: "pf2e-fc.settings.flat-check-target-marker.hint",
			scope: "user",
			config: !0,
			default: "enabled",
			choices: {
				enabled: "pf2e-fc.settings.flat-check-target-marker.choices.enabled",
				onlyWithOrigin: "pf2e-fc.settings.flat-check-target-marker.choices.onlyWithOrigin",
				disabled: "pf2e-fc.settings.flat-check-target-marker.choices.disabled"
			},
			type: String
		}), Z("flat-check-target-marker-display", {
			name: "pf2e-fc.settings.flat-check-target-marker-display.name",
			hint: "pf2e-fc.settings.flat-check-target-marker-display.hint",
			scope: "user",
			config: !0,
			default: "all",
			choices: {
				all: "pf2e-fc.settings.flat-check-target-marker-display.choices.all",
				outlineOnly: "pf2e-fc.settings.flat-check-target-marker-display.choices.outlineOnly",
				textOnly: "pf2e-fc.settings.flat-check-target-marker-display.choices.textOnly"
			},
			type: String
		}), Z("light-level-vis", {
			name: "pf2e-fc.settings.light-level-vis.name",
			hint: "pf2e-fc.settings.light-level-vis.hint",
			scope: "user",
			config: !0,
			default: !0,
			type: Boolean
		}), Z("delay-combat-tracker", {
			name: "pf2e-fc.settings.delay-combat-tracker.name",
			hint: "pf2e-fc.settings.delay-combat-tracker.hint",
			scope: "world",
			config: !0,
			default: !0,
			type: Boolean
		}), Z("delay-token-hud", {
			name: "pf2e-fc.settings.delay-token-hud.name",
			hint: "pf2e-fc.settings.delay-token-hud.hint",
			scope: "world",
			config: !0,
			default: !0,
			type: Boolean
		}), Z("delay-return", {
			name: "pf2e-fc.settings.delay-return.name",
			hint: "pf2e-fc.settings.delay-return.hint",
			scope: "world",
			config: !0,
			default: !0,
			type: Boolean
		}), Z("delay-prompt", {
			name: "pf2e-fc.settings.delay-prompt.name",
			hint: "pf2e-fc.settings.delay-prompt.hint",
			scope: "world",
			config: !0,
			default: !1,
			type: Boolean
		}), Z("delay-create-message", {
			name: "pf2e-fc.settings.delay-create-message.name",
			scope: "world",
			config: !0,
			default: !0,
			type: Boolean
		}), Z("token-hud-remove-combat-toggle", {
			name: "pf2e-fc.settings.token-hud-remove-combat-toggle.name",
			hint: "pf2e-fc.settings.token-hud-remove-combat-toggle.hint",
			scope: "world",
			config: !0,
			default: !1,
			type: Boolean
		}), Z("pf2e-hud-enable", {
			name: "pf2e-fc.settings.pf2e-hud-enable.name",
			hint: "pf2e-fc.settings.pf2e-hud-enable.hint",
			scope: "world",
			config: !0,
			default: !1,
			type: Boolean
		}), Z("lifelink", {
			name: "pf2e-fc.settings.lifelink.name",
			hint: "pf2e-fc.settings.lifelink.hint",
			scope: "world",
			config: !0,
			default: !0,
			type: Boolean
		}), Z("lifelink-formular", {
			name: "pf2e-fc.settings.lifelink-formular.name",
			hint: "pf2e-fc.settings.lifelink-formular.hint",
			scope: "world",
			config: !0,
			type: String,
			default: "apg",
			choices: {
				apg: "pf2e-fc.settings.lifelink-formular.choices.apg",
				plus: "pf2e-fc.settings.lifelink-formular.choices.plus"
			}
		}), Z("emanation-automation", {
			name: "pf2e-fc.settings.emanation-automation.name",
			hint: "",
			scope: "world",
			config: !0,
			type: Boolean,
			default: !1,
			flags: { requiresLibwrapper: !0 }
		}), Z("script-alt-roll-breakdown", {
			name: "pf2e-fc.settings.script-alt-roll-breakdown.name",
			hint: "pf2e-fc.settings.script-alt-roll-breakdown.hint",
			scope: "world",
			config: !0,
			type: Boolean,
			default: !1
		}), Z("script-toggle-shared-vision", {
			name: "pf2e-fc.settings.script-toggle-shared-vision.name",
			hint: "pf2e-fc.settings.script-toggle-shared-vision.hint",
			scope: "world",
			config: !0,
			type: Boolean,
			default: !1
		}), Hooks.on("updateSetting", Q), Hooks.on("renderSettingsConfig", cn);
	},
	addListener(e, t) {
		Y[e] = t;
	},
	removeListener(e) {
		delete Y[e];
	},
	callListener(e, t) {
		Y[e]?.(t);
	}
}, X = /* @__PURE__ */ new Map();
function Z(t, { flags: n, ...r }) {
	n && X.set(t, n), game.settings.register(e, t, {
		...r,
		onChange() {
			let n = game.settings.get(e, t);
			r.onChange?.(n), sn.callListener(t, n), Hooks.callAll(`${e}.updateSetting`, {
				key: t,
				value: n
			}), r.scope === "client" && Q({ key: `${e}.${t}` }, { value: n.toString() });
		}
	});
}
function Q(e, t) {
	if (!e.key.startsWith("pf2e-flatcheck-helper")) return;
	let n = e.key.split(".", 2).at(1);
	if (n) for (let e of Object.values($.modules)) {
		if (e.settingsKey !== n) continue;
		let t = e.hasSettingEnabled();
		t && e.enabled ? (e.enable(), e.enabled && e.onReady()) : !t && e.enabled && e.disable();
	}
}
function cn(t, n) {
	let r = n.querySelector(`.tab[data-tab="${e}"]`);
	if (!r) return;
	let i = (t, n) => {
		let i = r.querySelector(`label[for="settings-config-${e}.${t}"]`)?.parentElement;
		if (!i) return;
		let a = document.createElement("strong");
		a.textContent = u(n), a.style.fontSize = "var(--font-h5-size)", a.style.borderWidth = "0 0 1px 0", a.style.borderColor = "var(--color-tabs-border)", a.style.borderStyle = "solid", i.before(a);
	};
	if (i("flat-check-in-message", "settings.headings.flat"), i("delay-combat-tracker", "settings.headings.delay"), i("lifelink", "settings.headings.lifelink"), i("emanation-automation", "settings.headings.emanation-automation"), i("script-alt-roll-breakdown", "settings.headings.misc"), !game.modules.get("lib-wrapper")?.active) {
		let t = X.entries().filter(([e, t]) => t.requiresLibwrapper).map(([e, t]) => e);
		for (let n of t) {
			(r.querySelector(`label[for="settings-config-${e}.${n}"]`)?.parentElement)?.querySelector("p.hint")?.insertAdjacentHTML("afterbegin", "<span style=\"color: var(--color-level-error)\">libwrapper 필요. </span>");
			let t = r.querySelector(`input[name="${e}.${n}"]`);
			t && (t.title = "lib-wrapper 필요", t.disabled = !0, t.indeterminate = !0, t.style.cursor = "not-allowed");
		}
	}
	let a = l("<button type=\"button\"><i class=\"fas fa-cogs\"></i></button>");
	a.firstChild.addEventListener("click", () => {
		new k({ window: { title: u("settings.flat-check-config.name") } }).render(!0);
	});
	let o = r.querySelector(`input[name="${e}.flat-check-config"]`);
	o?.parentNode?.appendChild(a), o?.remove();
	let s = l(`<div>
		  <p>${u("settings.docs.description")}</p>
		  <button type="button" style="width: 100%;">
			  <i class="fas fa-book"></i>
				${u("settings.docs.button")}
			</button>
		</div>`);
	s.querySelector("button")?.addEventListener("click", async () => {
		let { GuideApp: e } = await import("./app-CGhDbjTG.js");
		new e().render(!0);
	}), r.prepend(s);
}
var $ = {
	socketHandler: new class {
		#e = {};
		init() {
			game.socket.on(`module.${e}`, (e) => {
				let t = this.#e[e.type];
				if (!t) throw Error(`No socker handler for '${e.type}'`);
				t(e.payload);
			});
		}
		register(e, t) {
			this.#e[e] = t;
		}
		unregister(e) {
			delete this.#e[e];
		}
		emit(t, n) {
			if (!(t in this.#e)) throw Error(`No socket callback registered for '${t}'`);
			game.socket.emit(`module.${e}`, {
				type: t,
				payload: n
			}), this.#e[t](n);
		}
	}(),
	settings: sn,
	modules: {
		flatMessageButtons: new vt(),
		lightVis: new Ee(),
		targetInfo: new Ut(),
		delay: new de(),
		emanation: new he(),
		lifeLink: new Wt(),
		altRollBreakdown: new Qt(),
		sharedVision: new nn()
	},
	debug: { re: !1 }
};
Hooks.on("init", () => {
	$.settings.init(), $.socketHandler.init(), Rt();
	for (let e of Object.values($.modules)) e.hasSettingEnabled() && e.enable();
	game.modules.get(e).debug = $.debug;
}), Hooks.on("ready", () => {
	for (let e of Object.values($.modules)) e.enabled && e.onReady();
	i.init();
});
//#endregion
export { u as a, h as i, k as n, e as o, te as r, $ as t };

//# sourceMappingURL=src-CeBlczsR.js.map