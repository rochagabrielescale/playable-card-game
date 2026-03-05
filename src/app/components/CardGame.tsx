import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";

import cardBack from "@/assets/f01f47b84bd2ee0b105fac3427d0504f0c577366.png";
import jackImg from "@/assets/982333128cbb8f6ba28d33e0545f023411b734f0.png";
import arkanImg from "@/assets/efd8ce789173f23c502cbd79784138024feecdb7.png";
import dsinImg from "@/assets/896147a4ddbb868cd840aef85fa3dba4f30c6422.png";
import fontanaImg from "@/assets/0a8437c731f87a684095df565a363b2f94dbdab4.png";
import gr81Img from "@/assets/bdca3ca2509583a0e541890cc5f634c0a0083cec.png";
import mpteixeiraImg from "@/assets/ba57a3c019e9f4af598a259ece7380f8515ba4da.png";
import dinscoutImg from "@/assets/bc4962f04cbe32012bf0e5d85d5994b56d87def6.png";
import logoImg from "@/assets/c2797e4034c188e1fc54832f106fbf13268cebb0.png";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  gold: "#c9a84c", goldLight: "#e8cc7a", goldDark: "#8c6d1f",
  goldGlow: "rgba(201,168,76,0.35)",
  silver: "#b8bcc8", silverDark: "#757a8a",
  black: "#080808", panel: "#101010", panelInner: "#0c0c0c", panelBorder: "#1e1e1e",
  textGold: "#d4af55", textSilver: "#9ca3af", textWhite: "#e8e6e0",
  textDim: "rgba(232,230,224,0.4)",
  chrome: "#3a3d45", chromeLt: "#5a5e68", chromeDk: "#22242a",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface PowerDef { name: string; desc: string; effect: { heal?: number; damage?: number; selfDamage?: number }; }
interface CardDef {
  id: string; name: string; subtitle: string; image: string;
  cost: number; power: number; powers: [PowerDef, PowerDef]; color: string;
}
type Phase = "player-turn" | "enemy-turn" | "game-over";
interface EnemyAction { card: CardDef; power: PowerDef; dmg: number; heal: number; }

// ─── Card Definitions ─────────────────────────────────────────────────────────
const CARD_DEFS: CardDef[] = [
  {
    id: "jackmalvadeza", name: "JACKMALVADEZA", subtitle: "O Antigo Boêmio",
    image: jackImg, cost: 8, power: 8,
    powers: [
      { name: "TADALA NA VEIA", desc: "Recupera 20HP e stamina infinita por 2 turnos", effect: { heal: 20, damage: 8 } },
      { name: "ASSIM???", desc: "Todo mundo trava \u2014 onda de choque psíquica de 30HP", effect: { damage: 30 } },
    ], color: "#e5a020",
  },
  {
    id: "arkanjonit", name: "ARKANJONIT", subtitle: "Mestre Churrasqueiro do Orto",
    image: arkanImg, cost: 9, power: 7,
    powers: [
      { name: "BBQ BLAST", desc: "Acende a grelha \u2014 recupera 50HP", effect: { heal: 50 } },
      { name: "NA TERRA OU NO AR", desc: "Ataque mergulho de urubu \u2014 80HP de dano!", effect: { damage: 80 } },
    ], color: "#c0392b",
  },
  {
    id: "dsincanada", name: "DSINCANADA", subtitle: "O Acendedor da Savana",
    image: dsinImg, cost: 7, power: 9,
    powers: [
      { name: "BRISA DELIRANTE", desc: "420HP de dano com fumaça! Custa 69HP de auto-dano", effect: { damage: 420, selfDamage: 69 } },
      { name: "RUGIDO DE FOTONS", desc: "Ilumina a área \u2014 explosão de fótons de 120HP", effect: { damage: 120 } },
    ], color: "#8e44ad",
  },
  {
    id: "fontana", name: "FONTANA", subtitle: "O Dentista Imortal",
    image: fontanaImg, cost: 6, power: 10,
    powers: [
      { name: "ANESTESIA ETILICA", desc: "Soro invulnerável \u2014 recupera 30HP, 5HP de auto-dano", effect: { heal: 30, selfDamage: 5 } },
      { name: "RABO DE BALA", desc: "Artilharia dentária \u2014 inimigo perde 50HP", effect: { damage: 50 } },
    ], color: "#b8860b",
  },
  {
    id: "gr81", name: "GR81", subtitle: "O Criador do Norte",
    image: gr81Img, cost: 10, power: 6,
    powers: [
      { name: "CORTE SECO", desc: "Reverte a última carta jogada \u2014 35HP de dano", effect: { damage: 35 } },
      { name: "PRODUCAO EM SERIE", desc: "Efeitos multiplicados \u2014 20HP de dano + recupera 15HP", effect: { damage: 20, heal: 15 } },
    ], color: "#16a34a",
  },
  {
    id: "mpteixeira", name: "MPTEIXEIRA", subtitle: "A Voz do Trovão",
    image: mpteixeiraImg, cost: 8, power: 8,
    powers: [
      { name: "CHAPA QUENTE", desc: "Conjura um RAIO-X do espaço \u2014 40HP de dano", effect: { damage: 40 } },
      { name: "SUSSURO SLOW-MO", desc: "Onda de choque sônica \u2014 25HP de dano, 15HP auto-dano", effect: { damage: 25, selfDamage: 15 } },
    ], color: "#dc2626",
  },
  {
    id: "dinscout", name: "DINSCOUT", subtitle: "O Caçador de Troféus",
    image: dinscoutImg, cost: 7, power: 9,
    powers: [
      { name: "CLT DA PSN", desc: "Troca cartas por progresso \u2014 60HP de dano, 50HP auto-dano", effect: { damage: 60, selfDamage: 50 } },
      { name: "PLATINA OU NADA", desc: "Conquista desbloqueada \u2014 recupera 40HP", effect: { heal: 40 } },
    ], color: "#b45309",
  },
];

// ─── Tutorial steps ───────────────────────────────────────────────────────────
type TutorialMode = "info" | "action";
interface TutorialStepDef {
  title: string;
  body: string;
  align: "center" | "bottom" | "top";
  mode: TutorialMode;
  actionHint?: string;
  highlight?: "hand" | "deck";
}
const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    title: "Bem-vindo ao SVP TCG! 🎴",
    body: "Você enfrenta o Dark Overlord. Reduza o HP dele a zero para vencer!\nEle começa com 500HP — você tem 300HP. Use suas cartas com sabedoria!",
    align: "center", mode: "info",
  },
  {
    title: "Barras de HP ❤️",
    body: "Na parte de cima fica o HP do Dark Overlord (cinza). Na parte de baixo fica o seu HP (dourado). Quando um dos dois chegar a zero, a batalha termina.",
    align: "center", mode: "info",
  },
  {
    title: "🃏 Jogue uma Carta!",
    body: "",
    align: "bottom", mode: "action",
    actionHint: "ARRASTE uma carta para o SEU CAMPO ↑   (no celular: TOQUE na carta)",
    highlight: "hand",
  },
  {
    title: "⚡ Escolha um Poder!",
    body: "",
    align: "center", mode: "action",
    actionHint: "Clique em um dos 2 PODERES acima para atacar ou curar",
  },
  {
    title: "👹 Vez do Inimigo...",
    body: "",
    align: "top", mode: "action",
    actionHint: "Aguarde o Dark Overlord fazer seu movimento...",
  },
  {
    title: "🎲 Compre uma Carta!",
    body: "",
    align: "bottom", mode: "action",
    actionHint: "Clique no BARALHO à direita para comprar uma nova carta →",
    highlight: "deck",
  },
  {
    title: "Pronto para Batalhar! ⚔️",
    body: "Você aprendeu o básico! Acompanhe o LOG de batalha para ver o que aconteceu em cada turno.\n🔍 Dica: segure qualquer carta na mão para ver a ilustração e os poderes em detalhes. No desktop, passe o mouse e clique no ⊕.\nBoa sorte, Comandante!",
    align: "center", mode: "info",
  },
];

// ─── Deck helpers ─────────────────────────────────────────────────────────────
let uidCounter = 0;
function newUid() { return `card-${++uidCounter}`; }
interface CardInstance { uid: string; def: CardDef; }

function buildDeck(): CardInstance[] {
  const all: CardInstance[] = [];
  for (let i = 0; i < 4; i++) CARD_DEFS.forEach((def) => all.push({ uid: newUid(), def }));
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

// ══════════════════════════════════════════════════════════════════════════════
// SVG ORNAMENTS
// ══════════════════════════════════════════════════════════════════════════════

function GoldDivider({ width = "100%" }: { width?: string | number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${T.gold})` }} />
      <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
        <polygon points="9,1 17,9 9,17 1,9" fill={T.gold} />
        <polygon points="9,4 14,9 9,14 4,9" fill={T.black} />
        <polygon points="9,6.5 11.5,9 9,11.5 6.5,9" fill={T.gold} />
      </svg>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${T.gold})` }} />
    </div>
  );
}

function CornerOrnament({ rotate = 0 }: { rotate?: number }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: `rotate(${rotate}deg)`, flexShrink: 0 }}>
      <line x1="0" y1="2" x2="20" y2="2" stroke={T.gold} strokeWidth="2" />
      <line x1="2" y1="0" x2="2" y2="20" stroke={T.gold} strokeWidth="2" />
      <polygon points="8,8 14,8 14,14 8,14" fill="none" stroke={T.gold} strokeWidth="1" transform="rotate(45 11 11)" />
      <circle cx="11" cy="11" r="2" fill={T.gold} />
    </svg>
  );
}

function CrosshairIcon({ size = 28, color = T.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="11" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="14" cy="14" r="4" fill="none" stroke={color} strokeWidth="1.5" />
      <line x1="14" y1="0" x2="14" y2="8" stroke={color} strokeWidth="1.5" />
      <line x1="14" y1="20" x2="14" y2="28" stroke={color} strokeWidth="1.5" />
      <line x1="0" y1="14" x2="8" y2="14" stroke={color} strokeWidth="1.5" />
      <line x1="20" y1="14" x2="28" y2="14" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// ── Card-back corner icons (unchanged SVGs) ──────────────────────────────────

function GearsIcon({ size = 100 }: { size?: number }) {
  const c1 = T.chrome, c2 = T.chromeLt, c3 = T.chromeDk;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <g>
        <circle cx="38" cy="40" r="22" fill={c3} stroke={c1} strokeWidth="1.5" />
        <circle cx="38" cy="40" r="16" fill="none" stroke={c2} strokeWidth="1" />
        <circle cx="38" cy="40" r="8" fill={c3} stroke={c1} strokeWidth="1.5" />
        <circle cx="38" cy="40" r="4" fill={c1} />
        {Array.from({ length: 12 }).map((_, i) => { const a = (i*30)*Math.PI/180; const x1=38+Math.cos(a)*20, y1=40+Math.sin(a)*20, x2=38+Math.cos(a)*25, y2=40+Math.sin(a)*25, px=Math.cos(a+Math.PI/2)*3, py=Math.sin(a+Math.PI/2)*3; return <polygon key={`lg-${i}`} points={`${x1-px},${y1-py} ${x2-px},${y2-py} ${x2+px},${y2+py} ${x1+px},${y1+py}`} fill={c1} stroke={c2} strokeWidth="0.5" />; })}
        {[0,60,120,180,240,300].map(d => { const a=d*Math.PI/180; return <line key={`sp-${d}`} x1={38+Math.cos(a)*5} y1={40+Math.sin(a)*5} x2={38+Math.cos(a)*15} y2={40+Math.sin(a)*15} stroke={c2} strokeWidth="1.5" />; })}
      </g>
      <g>
        <circle cx="16" cy="18" r="13" fill={c3} stroke={c1} strokeWidth="1.2" />
        <circle cx="16" cy="18" r="9" fill="none" stroke={c2} strokeWidth="0.8" />
        <circle cx="16" cy="18" r="5" fill={c3} stroke={c1} strokeWidth="1" />
        <circle cx="16" cy="18" r="2.5" fill={c1} />
        {Array.from({ length: 10 }).map((_, i) => { const a=(i*36+15)*Math.PI/180; const x1=16+Math.cos(a)*12, y1=18+Math.sin(a)*12, x2=16+Math.cos(a)*16, y2=18+Math.sin(a)*16, px=Math.cos(a+Math.PI/2)*2, py=Math.sin(a+Math.PI/2)*2; return <polygon key={`md-${i}`} points={`${x1-px},${y1-py} ${x2-px},${y2-py} ${x2+px},${y2+py} ${x1+px},${y1+py}`} fill={c1} stroke={c2} strokeWidth="0.4" />; })}
      </g>
      <g>
        <circle cx="62" cy="60" r="10" fill={c3} stroke={c1} strokeWidth="1" />
        <circle cx="62" cy="60" r="6" fill="none" stroke={c2} strokeWidth="0.7" />
        <circle cx="62" cy="60" r="3.5" fill={c3} stroke={c1} strokeWidth="1" />
        <circle cx="62" cy="60" r="2" fill={c1} />
        {Array.from({ length: 8 }).map((_, i) => { const a=(i*45)*Math.PI/180; const x1=62+Math.cos(a)*9, y1=60+Math.sin(a)*9, x2=62+Math.cos(a)*13, y2=60+Math.sin(a)*13, px=Math.cos(a+Math.PI/2)*2, py=Math.sin(a+Math.PI/2)*2; return <polygon key={`sm-${i}`} points={`${x1-px},${y1-py} ${x2-px},${y2-py} ${x2+px},${y2+py} ${x1+px},${y1+py}`} fill={c1} stroke={c2} strokeWidth="0.3" />; })}
      </g>
      <g>
        <circle cx="58" cy="22" r="7" fill={c3} stroke={c1} strokeWidth="0.8" />
        <circle cx="58" cy="22" r="3" fill={c3} stroke={c1} strokeWidth="0.8" />
        <circle cx="58" cy="22" r="1.5" fill={c2} />
        {Array.from({ length: 6 }).map((_, i) => { const a=(i*60+10)*Math.PI/180; const x1=58+Math.cos(a)*6, y1=22+Math.sin(a)*6, x2=58+Math.cos(a)*9, y2=22+Math.sin(a)*9, px=Math.cos(a+Math.PI/2)*1.5, py=Math.sin(a+Math.PI/2)*1.5; return <polygon key={`tn-${i}`} points={`${x1-px},${y1-py} ${x2-px},${y2-py} ${x2+px},${y2+py} ${x1+px},${y1+py}`} fill={c1} strokeWidth="0.3" stroke={c2} />; })}
      </g>
    </svg>
  );
}

function DragonIcon({ size = 100 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs><linearGradient id="dragonGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={T.chromeLt}/><stop offset="50%" stopColor={T.chrome}/><stop offset="100%" stopColor={T.chromeDk}/></linearGradient></defs>
      <path d="M72,15 C68,12 60,8 55,10 C50,12 52,18 48,22 C44,26 38,24 36,28 C34,32 38,36 36,40 C34,44 28,46 30,52 C32,58 38,56 40,62 C42,68 38,72 42,78 C46,84 52,82 56,88 C58,92 54,96 58,98" stroke="url(#dragonGrad)" strokeWidth="2" fill="none"/>
      <path d="M70,16 C66,14 62,10 56,12 C52,14 54,20 50,24 C46,28 40,26 38,30 C36,34 40,38 38,42 C36,46 30,48 32,54 C34,60 40,58 42,64 C44,70 40,74 44,80 C48,86 54,84 56,90" stroke={T.chrome} strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.4"/>
      <path d="M72,15 L80,8 L78,14 L82,11 L76,17 L72,15Z" fill={T.chrome} stroke={T.chromeLt} strokeWidth="0.5"/>
      <line x1="76" y1="10" x2="82" y2="2" stroke={T.chromeLt} strokeWidth="1.5"/><line x1="78" y1="12" x2="86" y2="6" stroke={T.chrome} strokeWidth="1.2"/>
      <circle cx="74" cy="13" r="1.2" fill={T.goldDark}/>
      <path d="M48,22 C40,10 28,6 18,8 C22,12 26,16 30,22 M48,22 C38,14 24,14 16,18 C22,20 28,22 34,26" stroke={T.chrome} strokeWidth="1" fill="none" opacity="0.7"/>
      <path d="M48,22 L18,8 L30,22Z" fill={T.chromeDk} opacity="0.3"/><path d="M48,22 L16,18 L34,26Z" fill={T.chromeDk} opacity="0.2"/>
      <line x1="48" y1="22" x2="22" y2="10" stroke={T.chrome} strokeWidth="0.5" opacity="0.5"/><line x1="48" y1="22" x2="20" y2="14" stroke={T.chrome} strokeWidth="0.5" opacity="0.5"/>
      <path d="M56,90 C60,94 64,92 66,88 C68,84 64,80 66,76 C68,72 74,74 74,70 C74,66 68,66 70,62 C72,58 78,60 78,56" stroke={T.chrome} strokeWidth="1.5" fill="none"/>
      <path d="M78,56 L82,52 L80,58 L84,55 L78,58Z" fill={T.chrome}/>
      {[[50,26],[38,32],[36,42],[34,54],[42,66],[44,78]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="1" fill={T.chromeLt} opacity="0.5"/>)}
      <g><path d="M60,90 L58,96 L62,94 M56,88 L54,94 L58,92" stroke={T.chromeLt} strokeWidth="1" fill="none"/><path d="M44,80 L40,84 L44,82 M42,78 L38,82 L42,80" stroke={T.chromeLt} strokeWidth="0.8" fill="none"/></g>
    </svg>
  );
}

function SoccerBallIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs><radialGradient id="ballGrad" cx="40%" cy="35%" r="50%"><stop offset="0%" stopColor={T.chromeLt}/><stop offset="70%" stopColor={T.chrome}/><stop offset="100%" stopColor={T.chromeDk}/></radialGradient></defs>
      <circle cx="32" cy="32" r="26" fill="url(#ballGrad)" stroke={T.chrome} strokeWidth="1.5"/>
      <polygon points="32,22 38,26 36,33 28,33 26,26" fill={T.chromeDk} stroke={T.chrome} strokeWidth="0.8"/>
      <polygon points="32,8 38,12 36,18 28,18 26,12" fill={T.chromeDk} stroke={T.chrome} strokeWidth="0.8"/>
      <polygon points="32,46 38,42 40,48 32,54 24,48 26,42" fill={T.chromeDk} stroke={T.chrome} strokeWidth="0.8"/>
      <polygon points="14,28 18,22 24,24 22,32 16,34" fill={T.chromeDk} stroke={T.chrome} strokeWidth="0.8"/>
      <polygon points="50,28 46,22 40,24 42,32 48,34" fill={T.chromeDk} stroke={T.chrome} strokeWidth="0.8"/>
    </svg>
  );
}

function RifleIcon({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 100" fill="none">
      <defs><linearGradient id="rifleGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={T.chromeLt}/><stop offset="50%" stopColor={T.chrome}/><stop offset="100%" stopColor={T.chromeDk}/></linearGradient></defs>
      <g transform="rotate(-25 60 50)">
        <rect x="20" y="42" width="70" height="8" rx="1" fill="url(#rifleGrad)" stroke={T.chrome} strokeWidth="0.8"/>
        <rect x="20" y="40" width="50" height="3" rx="0.5" fill={T.chromeDk} stroke={T.chrome} strokeWidth="0.5"/>
        <rect x="70" y="44" width="36" height="3" rx="0.5" fill={T.chrome} stroke={T.chromeLt} strokeWidth="0.5"/>
        <rect x="104" y="43" width="8" height="5" rx="0.5" fill={T.chromeDk} stroke={T.chrome} strokeWidth="0.5"/>
        <path d="M20,42 L10,42 C8,42 6,44 6,46 L6,52 C6,54 8,56 10,56 L20,54 L20,50Z" fill={T.chromeDk} stroke={T.chrome} strokeWidth="0.8"/>
        <path d="M42,50 L40,62 C40,64 42,66 44,66 L48,66 C50,66 50,64 50,62 L48,50Z" fill={T.chromeDk} stroke={T.chrome} strokeWidth="0.8"/>
        <path d="M42,50 C42,56 48,58 50,54 L50,50" fill="none" stroke={T.chrome} strokeWidth="1"/>
        <path d="M34,50 L32,68 C32,70 36,70 38,70 L42,70 C44,70 44,68 44,66 L42,50Z" fill={T.chrome} stroke={T.chromeLt} strokeWidth="0.6"/>
      </g>
    </svg>
  );
}

function ArtDecoArchOverlay() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 900 240" preserveAspectRatio="none">
      <path d="M40,0 L40,60 C40,120 120,180 200,200 L700,200 C780,180 860,120 860,60 L860,0" fill="none" stroke={T.gold} strokeWidth="0.8" opacity="0.15"/>
      <path d="M60,0 L60,50 C60,100 130,160 210,180 L690,180 C770,160 840,100 840,50 L840,0" fill="none" stroke={T.gold} strokeWidth="0.5" opacity="0.1"/>
      <polygon points="450,20 490,120 450,220 410,120" fill="none" stroke={T.gold} strokeWidth="0.5" opacity="0.08"/>
      <polygon points="450,50 475,120 450,190 425,120" fill="none" stroke={T.gold} strokeWidth="0.3" opacity="0.06"/>
      {[0,15,30,45].map(d=><line key={`tl-${d}`} x1="0" y1="0" x2={Math.cos(d*Math.PI/180)*80} y2={Math.sin(d*Math.PI/180)*80} stroke={T.gold} strokeWidth="0.3" opacity="0.08"/>)}
      {[0,15,30,45].map(d=><line key={`tr-${d}`} x1="900" y1="0" x2={900-Math.cos(d*Math.PI/180)*80} y2={Math.sin(d*Math.PI/180)*80} stroke={T.gold} strokeWidth="0.3" opacity="0.08"/>)}
      {[0,15,30,45].map(d=><line key={`bl-${d}`} x1="0" y1="240" x2={Math.cos(d*Math.PI/180)*80} y2={240-Math.sin(d*Math.PI/180)*80} stroke={T.gold} strokeWidth="0.3" opacity="0.08"/>)}
      {[0,15,30,45].map(d=><line key={`br-${d}`} x1="900" y1="240" x2={900-Math.cos(d*Math.PI/180)*80} y2={240-Math.sin(d*Math.PI/180)*80} stroke={T.gold} strokeWidth="0.3" opacity="0.08"/>)}
    </svg>
  );
}

function SideRailOrnament({ side }: { side: "left" | "right" }) {
  return (
    <div style={{ position: "absolute", [side]: -18, top: "10%", bottom: "10%", width: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", pointerEvents: "none", opacity: 0.4 }}>
      <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,0 12,6 6,12 0,6" fill="none" stroke={T.gold} strokeWidth="1"/><polygon points="6,3 9,6 6,9 3,6" fill={T.gold} opacity="0.5"/></svg>
      <div style={{ flex: 1, width: 1, margin: "4px 0", background: `linear-gradient(to bottom, ${T.gold}, ${T.gold}40, ${T.gold})` }} />
      <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="none" stroke={T.gold} strokeWidth="0.8"/><circle cx="7" cy="7" r="2" fill="none" stroke={T.gold} strokeWidth="0.8"/><line x1="7" y1="0" x2="7" y2="4" stroke={T.gold} strokeWidth="0.6"/><line x1="7" y1="10" x2="7" y2="14" stroke={T.gold} strokeWidth="0.6"/><line x1="0" y1="7" x2="4" y2="7" stroke={T.gold} strokeWidth="0.6"/><line x1="10" y1="7" x2="14" y2="7" stroke={T.gold} strokeWidth="0.6"/></svg>
      <div style={{ flex: 1, width: 1, margin: "4px 0", background: `linear-gradient(to bottom, ${T.gold}, ${T.gold}40, ${T.gold})` }} />
      <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,0 12,6 6,12 0,6" fill="none" stroke={T.gold} strokeWidth="1"/><polygon points="6,3 9,6 6,9 3,6" fill={T.gold} opacity="0.5"/></svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PANELS & UI COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function OrnatePanel({ children, style, innerStyle, corners = true }: { children: React.ReactNode; style?: React.CSSProperties; innerStyle?: React.CSSProperties; corners?: boolean }) {
  return (
    <div style={{ position: "relative", background: T.panel, border: `1.5px solid ${T.gold}`, boxShadow: `0 0 0 3px ${T.black}, 0 0 0 4px ${T.goldDark}40, inset 0 1px 0 ${T.gold}20, 0 8px 32px rgba(0,0,0,0.8)`, ...style }}>
      {corners && <>
        <div style={{ position: "absolute", top: -1, left: -1, zIndex: 2 }}><CornerOrnament rotate={0} /></div>
        <div style={{ position: "absolute", top: -1, right: -1, zIndex: 2 }}><CornerOrnament rotate={90} /></div>
        <div style={{ position: "absolute", bottom: -1, right: -1, zIndex: 2 }}><CornerOrnament rotate={180} /></div>
        <div style={{ position: "absolute", bottom: -1, left: -1, zIndex: 2 }}><CornerOrnament rotate={270} /></div>
      </>}
      <div style={{ position: "relative", zIndex: 1, ...innerStyle }}>{children}</div>
    </div>
  );
}

function HPBar({ hp, maxHp, label, variant = "gold" }: { hp: number; maxHp: number; label: string; variant?: "gold" | "silver" }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const barColor = pct > 50 ? (variant === "gold" ? `linear-gradient(90deg, ${T.goldDark}, ${T.gold})` : `linear-gradient(90deg, #444, ${T.silver})`) : pct > 25 ? "linear-gradient(90deg, #7c4a00, #f59e0b)" : "linear-gradient(90deg, #6b0000, #ef4444)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textGold, letterSpacing: "0.08em", fontWeight: "var(--font-weight-bold)" }}>{label}</span>
        <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textWhite, fontWeight: "var(--font-weight-bold)", letterSpacing: "0.04em" }}>{hp} <span style={{ color: T.textDim }}>/ {maxHp}</span></span>
      </div>
      <div style={{ width: "100%", height: 8, background: "#0a0a0a", border: `1px solid ${T.goldDark}80`, position: "relative", overflow: "hidden" }}>
        {[25,50,75].map(t=><div key={t} style={{ position: "absolute", left: `${t}%`, top: 0, bottom: 0, width: 1, background: "rgba(0,0,0,0.5)", zIndex: 2 }}/>)}
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }} style={{ height: "100%", background: barColor, position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "rgba(255,255,255,0.15)" }} />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Draggable Card View ──────────────────────────────────────────────────────
function DraggableCardView({
  card, onDragPlay, disabled, dropZoneRef, isMobile, onDragStateChange, onPreview,
}: {
  card: CardInstance; onDragPlay: (card: CardInstance) => void; disabled: boolean;
  dropZoneRef: React.RefObject<HTMLDivElement | null>; isMobile: boolean;
  onDragStateChange?: (dragging: boolean) => void;
  onPreview?: (def: CardDef) => void;
}) {
  const { def } = card;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const scale = useTransform(y, [0, -80, -200], [1, 1.08, 1.15]);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Long press detection
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  function startLongPress(e: React.PointerEvent) {
    didLongPress.current = false;
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onPreview?.(def);
    }, 480);
  }

  function cancelLongPress() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointerDownPos.current) return;
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 8) cancelLongPress();
  }

  const cardWidth = isMobile ? 80 : 118;
  const cardHeight = isMobile ? 114 : 168;

  function handleDragEnd(_: any, info: { point: { x: number; y: number }; velocity: { x: number; y: number } }) {
    setDragging(false);
    if (disabled) return;
    const dz = dropZoneRef.current;
    if (!dz) return;
    const rect = dz.getBoundingClientRect();
    const dropCX = rect.left + rect.width / 2;
    const dropCY = rect.top + rect.height / 2;
    const dist = Math.sqrt((info.point.x - dropCX) ** 2 + (info.point.y - dropCY) ** 2);
    if (dist < 160) onDragPlay(card);
  }

  function handleMobileClick() {
    if (disabled || !isMobile || didLongPress.current) return;
    onDragPlay(card);
  }

  return (
    <motion.div
      drag={!disabled && !isMobile}
      dragSnapToOrigin
      dragElastic={0.18}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
      onDragStart={() => { setDragging(true); onDragStateChange?.(true); cancelLongPress(); }}
      onDragEnd={(...args) => { onDragStateChange?.(false); handleDragEnd(...args); }}
      onClick={handleMobileClick}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={() => { cancelLongPress(); setHovered(false); }}
      onPointerMove={handlePointerMove}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ x, y, rotate, scale, cursor: disabled ? "default" : (isMobile ? "pointer" : "grab"), width: cardWidth, height: cardHeight, flexShrink: 0, position: "relative", overflow: "visible", zIndex: dragging ? 100 : 1, touchAction: "none" }}
      whileHover={!disabled ? { y: -14, scale: 1.06 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {/* Drag glow */}
      {dragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ position: "absolute", inset: -6, border: `2px solid ${T.gold}`, boxShadow: `0 0 30px ${T.goldGlow}, 0 0 60px ${def.color}30`, pointerEvents: "none", zIndex: 3 }}
        />
      )}
      <div style={{
        width: "100%", height: "100%",
        border: dragging ? `1.5px solid ${T.gold}` : "1.5px solid #2a2a2a",
        overflow: "hidden",
        boxShadow: dragging ? `0 0 0 1px ${T.black}, 0 20px 50px rgba(0,0,0,0.95), 0 0 24px ${T.goldGlow}` : "0 4px 16px rgba(0,0,0,0.6)",
        position: "relative", transition: "border-color 0.2s",
      }}>
        <img src={def.image} alt={def.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} draggable={false} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.95))", padding: "18px 5px 4px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ background: "rgba(0,0,0,0.85)", padding: "1px 6px", border: `1px solid ${T.gold}80`, color: T.textGold, fontSize: 10, fontFamily: "'Market Sans', sans-serif", fontWeight: "var(--font-weight-bold)" }}>{"\u2694"} {def.power}</div>
          <div style={{ background: "rgba(0,0,0,0.85)", padding: "1px 6px", border: `1px solid ${T.silver}60`, color: T.silver, fontSize: 10, fontFamily: "'Market Sans', sans-serif", fontWeight: "var(--font-weight-bold)" }}>{"\u2726"} {def.cost}</div>
        </div>
        {/* Card name overlay */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(rgba(0,0,0,0.85), transparent)", padding: "3px 5px 12px", pointerEvents: "none" }}>
          <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: 8, color: T.textGold, letterSpacing: "0.08em", fontWeight: "var(--font-weight-bold)" }}>{def.name}</span>
        </div>
        {/* Zoom icon — appears on hover (desktop) or always faintly visible (mobile) */}
        <motion.button
          initial={false}
          animate={{ opacity: isMobile ? 0.45 : (hovered ? 1 : 0) }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { e.stopPropagation(); cancelLongPress(); onPreview?.(def); }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Ver detalhes"
          style={{
            position: "absolute", bottom: 24, right: 4,
            width: 18, height: 18,
            background: "rgba(0,0,0,0.75)",
            border: `1px solid ${T.gold}80`,
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0,
            color: T.textGold, fontSize: 9,
            fontFamily: "'Market Sans', sans-serif",
            pointerEvents: "all",
            boxShadow: `0 0 6px ${T.goldGlow}`,
            zIndex: 5,
          }}
        >
          ⊕
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Card Preview Modal ───────────────────────────────────────────────────────
function CardPreviewModal({ def, onClose }: { def: CardDef; onClose: () => void }) {
  return (
    <motion.div
      key="card-preview-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.92)",
        display: "flex", flexDirection: "column", alignItems: "center",
        overflowY: "auto",
        padding: "20px",
      }}
    >
      <motion.div
        initial={{ scale: 0.72, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.82, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 360,
          margin: "auto",
          background: T.panel,
          border: `1.5px solid ${T.gold}`,
          boxShadow: `0 0 0 3px ${T.black}, 0 0 0 5px ${T.goldDark}50, 0 0 80px ${def.color}30, 0 0 60px ${T.goldGlow}, 0 32px 100px rgba(0,0,0,0.95)`,
          position: "relative", overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Corner ornaments */}
        <div style={{ position: "absolute", top: -1, left: -1, zIndex: 4 }}><CornerOrnament rotate={0}/></div>
        <div style={{ position: "absolute", top: -1, right: -1, zIndex: 4 }}><CornerOrnament rotate={90}/></div>
        <div style={{ position: "absolute", bottom: -1, right: -1, zIndex: 4 }}><CornerOrnament rotate={180}/></div>
        <div style={{ position: "absolute", bottom: -1, left: -1, zIndex: 4 }}><CornerOrnament rotate={270}/></div>
        {/* Background diamond pattern */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(45deg, ${T.gold}05 0px, ${T.gold}05 1px, transparent 1px, transparent 24px), repeating-linear-gradient(-45deg, ${T.gold}05 0px, ${T.gold}05 1px, transparent 1px, transparent 24px)`, zIndex: 0 }} />

        {/* Card illustration — top section */}
        <div style={{ position: "relative", width: "100%", height: "min(220px, 38vh)", flexShrink: 0, overflow: "hidden", zIndex: 1 }}>
          <img src={def.image} alt={def.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
          {/* Gradient at bottom of image */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(transparent, rgba(0,0,0,0.97))", pointerEvents: "none" }} />
          {/* Color accent strip at top */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${def.color}, transparent)` }} />
          {/* Name / subtitle over image */}
          <div style={{ position: "absolute", bottom: 10, left: 14, right: 50, zIndex: 2 }}>
            <p style={{ margin: 0, fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-h3)", fontWeight: "var(--font-weight-bold)", color: T.textGold, letterSpacing: "0.1em", textShadow: `0 0 16px ${T.goldGlow}` }}>{def.name}</p>
            <p style={{ margin: "2px 0 0", fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim, letterSpacing: "0.06em" }}>{def.subtitle}</p>
          </div>
          {/* Stats — top right */}
          <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 2 }}>
            <div style={{ background: "rgba(0,0,0,0.85)", border: `1px solid ${T.gold}80`, padding: "3px 10px", backdropFilter: "blur(4px)" }}>
              <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: 11, color: T.textGold, fontWeight: "var(--font-weight-bold)", letterSpacing: "0.06em" }}>⚔ {def.power}</span>
            </div>
            <div style={{ background: "rgba(0,0,0,0.85)", border: `1px solid ${T.silver}60`, padding: "3px 10px", backdropFilter: "blur(4px)" }}>
              <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: 11, color: T.silver, fontWeight: "var(--font-weight-bold)", letterSpacing: "0.06em" }}>✶ {def.cost}</span>
            </div>
          </div>
        </div>

        {/* Powers section — scrollable */}
        <div style={{ padding: "12px 16px 18px", overflowY: "auto", flex: 1, position: "relative", zIndex: 1 }}>
          <GoldDivider />
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {def.powers.map((pw, i) => {
              const tags: string[] = [];
              if (pw.effect.damage) tags.push(`${pw.effect.damage} DANO`);
              if (pw.effect.heal) tags.push(`+${pw.effect.heal} HP`);
              if (pw.effect.selfDamage) tags.push(`-${pw.effect.selfDamage} AUTO`);
              return (
                <div key={i} style={{ padding: "10px 12px", background: T.panelInner, border: `1px solid ${T.goldDark}60`, position: "relative", overflow: "hidden" }}>
                  {/* Left accent bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: def.color }} />
                  <div style={{ paddingLeft: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", fontWeight: "var(--font-weight-bold)", color: T.textGold, letterSpacing: "0.08em" }}>
                        {i === 0 ? "I" : "II"}  {pw.name}
                      </span>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {tags.map((tag) => (
                          <span key={tag} style={{ fontFamily: "'Market Sans', sans-serif", fontSize: 10, fontWeight: "var(--font-weight-bold)", color: tag.includes("AUTO") ? "#ef4444" : tag.includes("+") ? "#4ade80" : T.textGold, background: tag.includes("AUTO") ? "#ef444418" : tag.includes("+") ? "#4ade8018" : `${T.gold}18`, border: `1px solid ${tag.includes("AUTO") ? "#ef444440" : tag.includes("+") ? "#4ade8040" : T.goldDark}`, padding: "1px 7px", letterSpacing: "0.05em" }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textSilver, lineHeight: 1.5 }}>{pw.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14 }}><GoldDivider /></div>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: `0 0 20px ${T.goldGlow}` }}
              whileTap={{ scale: 0.96 }}
              onClick={onClose}
              style={{ background: "transparent", border: `1.5px solid ${T.gold}`, borderRadius: 0, padding: "8px 36px", fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", fontWeight: "var(--font-weight-bold)", color: T.textGold, cursor: "pointer", letterSpacing: "0.1em", boxShadow: `inset 0 1px 0 ${T.gold}30, 0 0 12px ${T.goldGlow}` }}
            >
              {"\u25C6"} Fechar {"\u25C6"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeckStack({ count, onDraw, canDraw, isMobile }: { count: number; onDraw: () => void; canDraw: boolean; isMobile: boolean }) {
  const deckWidth = isMobile ? 68 : 96;
  const deckHeight = isMobile ? 96 : 136;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <motion.div whileHover={canDraw ? { scale: 1.06, y: -4 } : {}} whileTap={canDraw ? { scale: 0.97 } : {}} onClick={canDraw ? onDraw : undefined} style={{ cursor: canDraw ? "pointer" : "default", position: "relative", width: deckWidth, height: deckHeight }}>
        {count > 2 && <img src={cardBack} alt="" draggable={false} style={{ position: "absolute", top: isMobile ? -5 : -7, left: isMobile ? -3 : -5, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45, filter: "brightness(0.5)" }} />}
        {count > 1 && <img src={cardBack} alt="" draggable={false} style={{ position: "absolute", top: isMobile ? -2.5 : -3.5, left: isMobile ? -1.5 : -2.5, width: "100%", height: "100%", objectFit: "cover", opacity: 0.65, filter: "brightness(0.65)" }} />}
        <img src={cardBack} alt="Draw" draggable={false} style={{ position: "relative", width: "100%", height: "100%", objectFit: "cover", border: canDraw ? `1.5px solid ${T.gold}` : `1.5px solid #2a2a2a`, boxShadow: canDraw ? `0 0 16px ${T.goldGlow}, 0 8px 24px rgba(0,0,0,0.7)` : "0 4px 12px rgba(0,0,0,0.6)", filter: canDraw ? "none" : "brightness(0.5) grayscale(0.4)", transition: "all 0.3s" }} />
        {canDraw && <motion.div animate={{ scale: [1,1.14,1], opacity: [0.7,0,0.7] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", inset: -5, border: `1.5px solid ${T.gold}`, pointerEvents: "none" }} />}
      </motion.div>
      <div style={{ background: T.panelInner, border: `1px solid ${T.goldDark}`, padding: "2px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <CrosshairIcon size={10} color={T.gold} />
        <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", fontWeight: "var(--font-weight-bold)", color: T.textGold, letterSpacing: "0.1em" }}>{count}</span>
      </div>
    </div>
  );
}

function PlayedCardSlot({ card, label, isDropZone, dropRef, isDragHovering, isMobile }: { card: CardInstance | null; label: string; isDropZone?: boolean; dropRef?: React.RefObject<HTMLDivElement | null>; isDragHovering?: boolean; isMobile: boolean }) {
  const slotWidth = isMobile ? 80 : 118;
  const slotHeight = isMobile ? 114 : 168;
  const bracketSize = isMobile ? 6 : 10;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 1 }}>
      <label style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim, letterSpacing: "0.08em" }}>{label}</label>
      <div ref={dropRef as any} style={{
        width: slotWidth, height: slotHeight,
        border: isDragHovering ? `2px solid ${T.gold}` : `1.5px dashed ${T.goldDark}60`,
        background: isDragHovering ? `${T.gold}10` : T.panelInner,
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: isDragHovering ? `0 0 30px ${T.goldGlow}, inset 0 0 20px ${T.goldGlow}` : "none",
        transition: "all 0.3s",
      }}>
        {[{ top: 4, left: 4 }, { top: 4, right: 4 }, { bottom: 4, left: 4 }, { bottom: 4, right: 4 }].map((pos, i) => (
          <div key={i} style={{ position: "absolute", width: bracketSize, height: bracketSize, borderTop: i < 2 ? `1px solid ${T.gold}` : undefined, borderBottom: i >= 2 ? `1px solid ${T.gold}` : undefined, borderLeft: i % 2 === 0 ? `1px solid ${T.gold}` : undefined, borderRight: i % 2 === 1 ? `1px solid ${T.gold}` : undefined, ...pos }} />
        ))}
        <AnimatePresence>
          {card ? (
            <motion.div key={card.uid} initial={{ scale: 0.4, opacity: 0, rotateY: 90 }} animate={{ scale: 1, opacity: 1, rotateY: 0 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.45, type: "spring" }} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
              <img src={card.def.image} alt={card.def.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
            </motion.div>
          ) : (
            <div style={{ textAlign: "center" }}>
              {isDropZone ? (
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
                  <CrosshairIcon size={28} color={T.gold} />
                </motion.div>
              ) : (
                <CrosshairIcon size={22} color={`${T.gold}40`} />
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FighterRow({ label, hp, maxHp, emoji, hpVariant, statusText, shake, isEnemy = false, isMobile }: { label: string; hp: number; maxHp: number; emoji: string; hpVariant: "gold" | "silver"; statusText: string; shake: boolean; isEnemy?: boolean; isMobile: boolean }) {
  const emojiBoxSize = isMobile ? 40 : 56;
  const padding = isMobile ? "8px 12px" : "14px 20px";
  const gap = isMobile ? 10 : 16;

  return (
    <OrnatePanel style={{ borderRadius: 0 }} innerStyle={{ padding }}>
      <div style={{ display: "flex", alignItems: "center", gap }}>
        <motion.div animate={shake ? { x: [-7,7,-7,7,0], transition: { duration: 0.4 } } : {}} style={{ width: emojiBoxSize, height: emojiBoxSize, flexShrink: 0, background: isEnemy ? "radial-gradient(circle at 40% 35%, #2a0040, #0d0010)" : "radial-gradient(circle at 40% 35%, #001030, #000818)", border: `1.5px solid ${isEnemy ? "#5a2080" : T.goldDark}`, boxShadow: isEnemy ? "0 0 16px rgba(90,32,128,0.5)" : `0 0 16px ${T.goldGlow}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 18 : 26 }}>
          {emoji}
        </motion.div>
        <div style={{ flex: 1 }}><HPBar hp={hp} maxHp={maxHp} label={label} variant={hpVariant} /></div>
        <div style={{ border: `1px solid ${isEnemy ? "#5a2080" : T.goldDark}`, background: T.panelInner, padding: "3px 12px", flexShrink: 0 }}>
          <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: isEnemy ? "#a78bca" : T.textGold, letterSpacing: "0.06em" }}>{statusText}</span>
        </div>
      </div>
    </OrnatePanel>
  );
}

/** Enemy action display strip */
function EnemyActionBar({ action }: { action: EnemyAction | null }) {
  return (
    <AnimatePresence>
      {action && (
        <motion.div
          key="enemy-action"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          style={{ overflow: "hidden" }}
        >
          <div style={{
            background: `linear-gradient(90deg, ${T.panelInner}, ${action.card.color}18, ${T.panelInner})`,
            border: `1.5px solid #5a2080`,
            borderTop: "none",
            padding: "8px 20px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 36, height: 50, flexShrink: 0, overflow: "hidden", border: `1px solid #5a2080` }}>
              <img src={action.card.image} alt={action.card.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", fontWeight: "var(--font-weight-bold)", color: "#a78bca", letterSpacing: "0.08em" }}>
                {"\uD83D\uDC79"} {action.card.name}
                <span style={{ color: T.textDim, fontWeight: "var(--font-weight-regular)", marginLeft: 8 }}>{"\u2014"} {action.power.name}</span>
              </p>
              <p style={{ margin: "2px 0 0", fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textSilver }}>{action.power.desc}</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {action.dmg > 0 && <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: 10, fontWeight: "var(--font-weight-bold)", color: "#ef4444", background: "#ef444418", border: "1px solid #ef444440", padding: "1px 8px", letterSpacing: "0.06em" }}>{action.dmg} DANO</span>}
              {action.heal > 0 && <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: 10, fontWeight: "var(--font-weight-bold)", color: "#a78bca", background: "#a78bca18", border: "1px solid #a78bca40", padding: "1px 8px", letterSpacing: "0.06em" }}>+{action.heal} HP</span>}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LogPanel({ logs }: { logs: string[] }) {
  return (
    <OrnatePanel corners={false} style={{ borderRadius: 0 }} innerStyle={{ padding: "8px 14px" }}>
      <div style={{ maxHeight: 80, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {logs.length === 0 ? (
          <p style={{ margin: 0, fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim }}>{"\u25C6"} Aguardando primeira jogada...</p>
        ) : (
          logs.slice(-6).reverse().map((log, i) => (
            <p key={i} style={{ margin: 0, fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: i === 0 ? T.textWhite : T.textDim, borderLeft: i === 0 ? `2px solid ${T.gold}` : "2px solid transparent", paddingLeft: 6 }}>{log}</p>
          ))
        )}
      </div>
    </OrnatePanel>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN GAME
// ══════════════════════════════════════════════════════════════════════════════
export function CardGame() {
  const MAX_PLAYER_HP = 300;
  const MAX_ENEMY_HP = 500;

  // ── Mobile responsive detection ──
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Intro animation state ──
  type IntroStage = "black" | "logo" | "text" | "fadeout" | "done";
  const [introStage, setIntroStage] = useState<IntroStage>("black");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setIntroStage("logo"), 400));
    timers.push(setTimeout(() => setIntroStage("text"), 2600));
    // Stops at "text" — waits for START GAME button press
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Tutorial state ──
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  function skipTutorial() { setTutorialStep(null); }
  function nextTutorial() {
    setTutorialStep((s) => (s === null || s >= TUTORIAL_STEPS.length - 1) ? null : s + 1);
  }

  function handleStartGame() {
    setIntroStage("fadeout");
    setTimeout(() => { setIntroStage("done"); setTutorialStep(0); }, 800);
  }

  const [deck, setDeck] = useState<CardInstance[]>([]);
  const [hand, setHand] = useState<CardInstance[]>([]);
  const [playerPlayed, setPlayerPlayed] = useState<CardInstance | null>(null);
  const [enemyPlayed, setEnemyPlayed] = useState<CardInstance | null>(null);
  const [playerHP, setPlayerHP] = useState(MAX_PLAYER_HP);
  const [enemyHP, setEnemyHP] = useState(MAX_ENEMY_HP);
  const [phase, setPhase] = useState<Phase>("player-turn");
  const [logs, setLogs] = useState<string[]>([]);
  const [enemyShake, setEnemyShake] = useState(false);
  const [playerShake, setPlayerShake] = useState(false);
  const [choosingPowerCard, setChoosingPowerCard] = useState<CardInstance | null>(null);
  const [enemyAction, setEnemyAction] = useState<EnemyAction | null>(null);
  const [isDragHover, setIsDragHover] = useState(false);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [previewCard, setPreviewCard] = useState<CardDef | null>(null);

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const addLog = useCallback((msg: string) => setLogs((l) => [...l, msg]), []);

  // Track drag proximity for drop zone glow
  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const dz = dropZoneRef.current;
      if (!dz) { setIsDragHover(false); return; }
      // Only show glow when a pointer button is held (dragging)
      if (e.buttons === 0) { setIsDragHover(false); return; }
      const rect = dz.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
      setIsDragHover(dist < 180);
    }
    function onPointerUp() { setIsDragHover(false); }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => { window.removeEventListener("pointermove", onPointerMove); window.removeEventListener("pointerup", onPointerUp); };
  }, []);

  useEffect(() => {
    const d = buildDeck();
    setHand(d.splice(0, 3));
    setDeck(d);
  }, []);

  // ── Enemy turn — picks a random card & power, shows it visually ──
  useEffect(() => {
    if (phase !== "enemy-turn") return;

    // Step 1: Show card face-down briefly
    const enemyCard = CARD_DEFS[Math.floor(Math.random() * CARD_DEFS.length)];
    const enemyInst: CardInstance = { uid: `enemy-${Date.now()}`, def: enemyCard };
    setEnemyPlayed(enemyInst);
    setEnemyAction(null);

    // Step 2: After delay, reveal power choice and apply
    const t = setTimeout(() => {
      const powerIdx = Math.random() > 0.5 ? 1 : 0;
      const chosenPower = enemyCard.powers[powerIdx];
      const { effect } = chosenPower;

      // For enemy: damage hits player, heal heals enemy, selfDamage hits enemy
      const dmgToPlayer = effect.damage || 0;
      const healEnemy = effect.heal || 0;
      const selfDmg = effect.selfDamage || 0;

      if (dmgToPlayer > 0) {
        setPlayerHP((h) => { const n = Math.max(0, h - dmgToPlayer); if (n === 0) setPhase("game-over"); return n; });
        setPlayerShake(true);
        setTimeout(() => setPlayerShake(false), 500);
      }
      if (healEnemy > 0) setEnemyHP((h) => Math.min(MAX_ENEMY_HP, h + healEnemy));
      if (selfDmg > 0) {
        setEnemyHP((h) => { const n = Math.max(0, h - selfDmg); if (n === 0) setPhase("game-over"); return n; });
        setEnemyShake(true);
        setTimeout(() => setEnemyShake(false), 500);
      }

      setEnemyAction({ card: enemyCard, power: chosenPower, dmg: dmgToPlayer, heal: healEnemy });
      let msg = `\uD83D\uDC79 ${enemyCard.name} \u2014 ${chosenPower.name}!`;
      if (dmgToPlayer > 0) msg += ` ${dmgToPlayer} de DANO em você!`;
      if (healEnemy > 0) msg += ` +${healEnemy}HP recuperados.`;
      if (selfDmg > 0) msg += ` (${selfDmg} auto-dano)`;
      addLog(msg);

      // Step 3: After showing result, return to player turn
      setTimeout(() => {
        setPhase("player-turn");
        setTutorialStep((s) => (s === 4 ? 5 : s));
      }, 1200);
    }, 1200);

    return () => clearTimeout(t);
  }, [phase, addLog]);

  // ── Drag a card to the board → open power picker ──
  function handleDragPlay(cardInst: CardInstance) {
    if (phase !== "player-turn" || choosingPowerCard) return;
    setHand((h) => h.filter((c) => c.uid !== cardInst.uid));
    setPlayerPlayed(cardInst);
    setChoosingPowerCard(cardInst);
    setEnemyAction(null);
    if (tutorialStep === 2) setTutorialStep(3);
  }

  function executePower(powerIndex: 0 | 1) {
    if (!choosingPowerCard) return;
    const { def } = choosingPowerCard;
    const chosenPower = def.powers[powerIndex];
    const { effect } = chosenPower;
    let msg = `\u25C6 ${def.name} \u2014 ${chosenPower.name}!`;
    if (effect.heal) { setPlayerHP((h) => Math.min(MAX_PLAYER_HP, h + effect.heal!)); msg += ` +${effect.heal}HP`; }
    if (effect.damage) {
      setEnemyHP((h) => { const n = Math.max(0, h - effect.damage!); if (n === 0) setPhase("game-over"); return n; });
      setEnemyShake(true); setTimeout(() => setEnemyShake(false), 500);
      msg += ` \u2014 ${effect.damage} de DANO causado!`;
    }
    if (effect.selfDamage) { setPlayerHP((h) => Math.max(0, h - effect.selfDamage!)); msg += ` (${effect.selfDamage} auto-dano)`; }
    addLog(msg);
    setChoosingPowerCard(null);
    setPhase("enemy-turn");
    if (tutorialStep === 3) setTutorialStep(4);
  }

  function drawCard() {
    if (hand.length >= 5 || deck.length === 0) return;
    const [drawn, ...rest] = deck;
    setDeck(rest); setHand((h) => [...h, drawn]);
    addLog(`\uD83C\uDFB4 Comprou ${drawn.def.name} do baralho.`);
    if (tutorialStep === 5) setTutorialStep(6);
  }

  function restartGame() {
    uidCounter = 0;
    const d = buildDeck();
    setHand(d.splice(0, 3)); setDeck(d);
    setPlayerPlayed(null); setEnemyPlayed(null);
    setPlayerHP(MAX_PLAYER_HP); setEnemyHP(MAX_ENEMY_HP);
    setPhase("player-turn"); setLogs([]); setChoosingPowerCard(null); setEnemyAction(null); setTutorialStep(null);
  }

  const isPlayerTurn = phase === "player-turn";
  const isGameOver = phase === "game-over";
  const playerWon = isGameOver && enemyHP === 0;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: `radial-gradient(ellipse at 50% 0%, #1a1200 0%, #0a0a00 30%, ${T.black} 70%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px 16px", gap: 0,
      position: "relative", overflow: "hidden",
      fontFamily: "'Market Sans', sans-serif",
    }}>
      {/* Background patterns */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, ${T.gold}08 40px, ${T.gold}08 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, ${T.gold}08 40px, ${T.gold}08 41px), repeating-linear-gradient(45deg, transparent, transparent 56px, ${T.gold}04 56px, ${T.gold}04 57px), repeating-linear-gradient(-45deg, transparent, transparent 56px, ${T.gold}04 56px, ${T.gold}04 57px)` }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />

      {/* ══════════════ INTRO CINEMATIC ══════════════ */}
      <AnimatePresence>
        {introStage !== "done" && (
          <motion.div
            key="intro-overlay"
            initial={{ opacity: 1 }}
            animate={{ opacity: introStage === "fadeout" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: introStage === "fadeout" ? 0.8 : 0.3 }}
            style={{
              position: "fixed", inset: 0, zIndex: 300,
              background: T.black,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* Animated sunburst rays behind logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={introStage !== "black" ? { opacity: 0.12, scale: 1.2, rotate: 15 } : {}}
              transition={{ duration: 3, ease: "easeOut" }}
              style={{ position: "absolute", width: 600, height: 600, pointerEvents: "none" }}
            >
              <svg width="600" height="600" viewBox="0 0 600 600">
                {Array.from({ length: 24 }).map((_, i) => {
                  const a = (i * 15) * Math.PI / 180;
                  return <line key={i} x1="300" y1="300" x2={300 + Math.cos(a) * 300} y2={300 + Math.sin(a) * 300} stroke={T.gold} strokeWidth={i % 2 === 0 ? "1.5" : "0.5"} />;
                })}
              </svg>
            </motion.div>

            {/* Expanding gold ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={introStage !== "black" ? { opacity: [0, 0.4, 0], scale: [0.3, 2.5] } : {}}
              transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
              style={{
                position: "absolute", width: 200, height: 200,
                border: `2px solid ${T.gold}`,
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />
            {/* Second ring, delayed */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={introStage !== "black" ? { opacity: [0, 0.2, 0], scale: [0.3, 3] } : {}}
              transition={{ duration: 2.8, ease: "easeOut", delay: 0.8 }}
              style={{
                position: "absolute", width: 200, height: 200,
                border: `1px solid ${T.goldDark}`,
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />

            {/* Corner ornaments on intro screen */}
            <div style={{ position: "absolute", top: 20, left: 20, opacity: 0.3 }}><CornerOrnament rotate={0} /></div>
            <div style={{ position: "absolute", top: 20, right: 20, opacity: 0.3 }}><CornerOrnament rotate={90} /></div>
            <div style={{ position: "absolute", bottom: 20, right: 20, opacity: 0.3 }}><CornerOrnament rotate={180} /></div>
            <div style={{ position: "absolute", bottom: 20, left: 20, opacity: 0.3 }}><CornerOrnament rotate={270} /></div>

            {/* Diamond pattern bg */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              backgroundImage: `repeating-linear-gradient(45deg, ${T.gold}04 0px, ${T.gold}04 1px, transparent 1px, transparent 40px), repeating-linear-gradient(-45deg, ${T.gold}04 0px, ${T.gold}04 1px, transparent 1px, transparent 40px)`,
            }} />

            {/* Logo */}
            <motion.img
              src={logoImg}
              alt="SVP Logo"
              draggable={false}
              initial={{ opacity: 0, scale: 0.3, filter: "brightness(0)" }}
              animate={introStage !== "black" ? {
                opacity: 1,
                scale: [0.3, 1.15, 1],
                filter: "brightness(1)",
              } : {}}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], times: [0, 0.6, 1] }}
              style={{
                width: isMobile ? 100 : 140, height: isMobile ? 100 : 140, objectFit: "contain",
                position: "relative", zIndex: 2,
                filter: `drop-shadow(0 0 40px ${T.goldGlow}) drop-shadow(0 0 80px ${T.goldGlow})`,
              }}
            />

            {/* Logo glow pulse */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={introStage !== "black" ? { opacity: [0, 0.6, 0.3], scale: [0.8, 1.2, 1] } : {}}
              transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
              style={{
                position: "absolute",
                width: 200, height: 200,
                background: `radial-gradient(circle, ${T.goldGlow} 0%, transparent 70%)`,
                pointerEvents: "none", zIndex: 1,
              }}
            />

            {/* Title text — appears in "text" stage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={(introStage === "text" || introStage === "fadeout") ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 12, marginTop: 28, position: "relative", zIndex: 2,
              }}
            >
              <GoldDivider width={isMobile ? 260 : 340} />
              <h1 style={{
                fontFamily: "'Market Sans', sans-serif",
                fontSize: isMobile ? "var(--text-p)" : "var(--text-h2)",
                fontWeight: "var(--font-weight-bold)",
                margin: 0, color: T.textGold,
                letterSpacing: "0.16em",
                textShadow: `0 0 30px ${T.goldGlow}`,
              }}>
                SVP TRADING CARD GAME
              </h1>
              <p style={{
                fontFamily: "'Market Sans', sans-serif",
                fontSize: "var(--text-p)",
                color: T.textDim, margin: 0,
                letterSpacing: "0.1em",
              }}>
                PRIMEIRA EDIÇÃO  {"\u00B7"}  {"\u00A9"}2026
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={(introStage === "text" || introStage === "fadeout") ? { opacity: 1 } : {}}
                transition={{ delay: 0.6, duration: 0.6 }}
                style={{
                  fontFamily: "'Market Sans', sans-serif",
                  fontSize: "var(--text-label)",
                  color: T.textSilver, margin: 0,
                  letterSpacing: "0.08em",
                }}
              >
                ARTE POR GABRIEL ROCHA
              </motion.p>
              <GoldDivider width={isMobile ? 260 : 340} />

              {/* START GAME button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={(introStage === "text") ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
                whileHover={{ scale: 1.06, boxShadow: `0 0 32px ${T.goldGlow}, 0 0 60px ${T.goldGlow}` }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartGame}
                style={{
                  marginTop: 8,
                  background: "transparent",
                  border: `1.5px solid ${T.gold}`,
                  borderRadius: 0,
                  padding: isMobile ? "10px 40px" : "14px 56px",
                  fontFamily: "'Market Sans', sans-serif",
                  fontSize: "var(--text-p)",
                  fontWeight: "var(--font-weight-bold)",
                  color: T.textGold,
                  cursor: "pointer",
                  letterSpacing: "0.14em",
                  boxShadow: `inset 0 1px 0 ${T.gold}30, 0 0 20px ${T.goldGlow}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Shimmer sweep */}
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                  style={{
                    position: "absolute", inset: 0,
                    background: `linear-gradient(90deg, transparent 0%, ${T.gold}15 40%, ${T.gold}30 50%, ${T.gold}15 60%, transparent 100%)`,
                    pointerEvents: "none",
                  }}
                />
                {"\u25C6"}  INICIAR JOGO  {"\u25C6"}
              </motion.button>
            </motion.div>

            {/* Horizontal gold lines that sweep in */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={introStage !== "black" ? { scaleX: 1, opacity: 0.3 } : {}}
              transition={{ duration: 1.8, ease: "easeOut", delay: 0.5 }}
              style={{
                position: "absolute", top: "50%", left: "5%", right: "5%",
                height: 1, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
                transformOrigin: "center", marginTop: -100,
              }}
            />
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={introStage !== "black" ? { scaleX: 1, opacity: 0.3 } : {}}
              transition={{ duration: 1.8, ease: "easeOut", delay: 0.7 }}
              style={{
                position: "absolute", top: "50%", left: "5%", right: "5%",
                height: 1, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
                transformOrigin: "center", marginTop: 100,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* GAME OVER */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
            <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 18 }} style={{ textAlign: "center" }}>
              <GoldDivider width={300} />
              <div style={{ margin: "24px 0 12px", fontSize: 72 }}>{playerWon ? "\uD83C\uDFC6" : "\uD83D\uDC80"}</div>
              <h2 style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-bold)", margin: 0, color: playerWon ? T.goldLight : "#ef4444", textShadow: `0 0 40px ${playerWon ? T.goldGlow : "rgba(239,68,68,0.5)"}`, letterSpacing: "0.1em" }}>{playerWon ? "VITÓRIA" : "DERROTADO"}</h2>
              <p style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-p)", color: T.textSilver, marginTop: 10 }}>{playerWon ? "O Dark Overlord foi derrotado." : "Você caiu em batalha gloriosa."}</p>
              <div style={{ marginTop: 16 }}><GoldDivider width={300} /></div>
            </motion.div>
            <motion.button whileHover={{ scale: 1.05, boxShadow: `0 0 24px ${T.goldGlow}` }} whileTap={{ scale: 0.97 }} onClick={restartGame} style={{ background: "transparent", border: `1.5px solid ${T.gold}`, borderRadius: 0, padding: "12px 48px", fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-p)", fontWeight: "var(--font-weight-bold)", color: T.textGold, cursor: "pointer", letterSpacing: "0.12em", boxShadow: `inset 0 1px 0 ${T.gold}30` }}>{"\u25C6"} JOGAR DE NOVO {"\u25C6"}</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POWER PICKER OVERLAY */}
      <AnimatePresence>
        {choosingPowerCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, padding: isMobile ? "20px" : "0" }}>
            <motion.div initial={{ scale: 0.7, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.7, opacity: 0, y: 30 }} transition={{ type: "spring", stiffness: 200, damping: 22 }} style={{ width: "100%", maxWidth: isMobile ? "95vw" : 560, background: T.panel, border: `1.5px solid ${T.gold}`, boxShadow: `0 0 0 3px ${T.black}, 0 0 0 5px ${T.goldDark}50, 0 0 60px ${T.goldGlow}, 0 24px 80px rgba(0,0,0,0.9)`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -1, left: -1, zIndex: 2 }}><CornerOrnament rotate={0}/></div>
              <div style={{ position: "absolute", top: -1, right: -1, zIndex: 2 }}><CornerOrnament rotate={90}/></div>
              <div style={{ position: "absolute", bottom: -1, right: -1, zIndex: 2 }}><CornerOrnament rotate={180}/></div>
              <div style={{ position: "absolute", bottom: -1, left: -1, zIndex: 2 }}><CornerOrnament rotate={270}/></div>
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(45deg, ${T.gold}06 0px, ${T.gold}06 1px, transparent 1px, transparent 24px), repeating-linear-gradient(-45deg, ${T.gold}06 0px, ${T.gold}06 1px, transparent 1px, transparent 24px)` }} />

              {/* Header */}
              <div style={{ padding: "16px 24px 12px", borderBottom: `1px solid ${T.goldDark}50`, position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 52, height: 72, flexShrink: 0, overflow: "hidden", border: `1px solid ${T.gold}`, boxShadow: `0 0 12px ${T.goldGlow}` }}>
                  <img src={choosingPowerCard.def.image} alt={choosingPowerCard.def.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-p)", fontWeight: "var(--font-weight-bold)", color: T.textGold, letterSpacing: "0.1em" }}>{choosingPowerCard.def.name}</p>
                  <p style={{ margin: "2px 0 0", fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim, letterSpacing: "0.06em" }}>{choosingPowerCard.def.subtitle}</p>
                  <div style={{ marginTop: 6 }}><GoldDivider /></div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {[{ val: choosingPowerCard.def.power, lbl: "POD", c: T.textGold }, { val: choosingPowerCard.def.cost, lbl: "CUSTO", c: T.silver }].map(({ val, lbl, c }) => (
                    <div key={lbl} style={{ textAlign: "center", border: `1px solid ${T.goldDark}`, padding: "2px 8px", background: T.panelInner }}>
                      <p style={{ margin: 0, color: c, fontSize: 16, fontFamily: "'Market Sans', sans-serif", fontWeight: "var(--font-weight-bold)" }}>{val}</p>
                      <label style={{ fontFamily: "'Market Sans', sans-serif", color: T.textDim, letterSpacing: "0.06em" }}>{lbl}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div style={{ padding: "10px 24px 6px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, position: "relative", zIndex: 1 }}>
                <CrosshairIcon size={12} color={T.gold} />
                <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textGold, letterSpacing: "0.14em", fontWeight: "var(--font-weight-bold)" }}>ESCOLHA SEU PODER</span>
                <CrosshairIcon size={12} color={T.gold} />
              </div>

              {/* Tutorial step 3 hint banner */}
              {tutorialStep === 3 && (
                <div style={{ margin: "0 24px 4px", padding: "8px 14px", background: `${T.goldGlow}`, border: `1px solid ${T.gold}80`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, position: "relative", zIndex: 1 }}>
                  <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textGold, letterSpacing: "0.06em" }}>⚡ Escolha um dos poderes abaixo para avançar no guia</span>
                  <motion.button whileHover={{ color: T.textGold }} onClick={skipTutorial} style={{ background: "none", border: "none", fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim, cursor: "pointer", letterSpacing: "0.08em", flexShrink: 0 }}>{"\u25C6"} Pular</motion.button>
                </div>
              )}

              {/* Power buttons */}
              <div style={{ padding: "8px 24px 20px", display: "flex", gap: 12, position: "relative", zIndex: 1 }}>
                {choosingPowerCard.def.powers.map((pw, idx) => {
                  const tags: string[] = [];
                  if (pw.effect.damage) tags.push(`${pw.effect.damage} DANO`);
                  if (pw.effect.heal) tags.push(`+${pw.effect.heal} HP`);
                  if (pw.effect.selfDamage) tags.push(`-${pw.effect.selfDamage} AUTO`);
                  return (
                    <motion.button key={idx} whileHover={{ scale: 1.03, boxShadow: `0 0 24px ${choosingPowerCard.def.color}40, 0 0 0 1px ${T.gold}` }} whileTap={{ scale: 0.97 }} onClick={() => executePower(idx as 0 | 1)} style={{ flex: 1, background: `linear-gradient(135deg, ${T.panelInner}, ${choosingPowerCard.def.color}0c)`, border: `1.5px solid ${T.goldDark}`, borderRadius: 0, padding: "14px 16px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, textAlign: "left", transition: "border-color 0.2s", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, right: 0, background: T.goldDark, padding: "2px 8px" }}>
                        <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: 10, color: T.black, fontWeight: "var(--font-weight-bold)", letterSpacing: "0.08em" }}>{idx === 0 ? "I" : "II"}</span>
                      </div>
                      <p style={{ margin: 0, fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-p)", fontWeight: "var(--font-weight-bold)", color: T.textGold, letterSpacing: "0.06em" }}>{pw.name}</p>
                      <p style={{ margin: 0, fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textSilver, lineHeight: 1.4 }}>{pw.desc}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                        {tags.map((tag) => (
                          <span key={tag} style={{ fontFamily: "'Market Sans', sans-serif", fontSize: 10, fontWeight: "var(--font-weight-bold)", color: tag.includes("AUTO") ? "#ef4444" : tag.includes("+") ? "#4ade80" : T.textGold, background: tag.includes("AUTO") ? "#ef444418" : tag.includes("+") ? "#4ade8018" : `${T.gold}18`, border: `1px solid ${tag.includes("AUTO") ? "#ef444440" : tag.includes("+") ? "#4ade8040" : T.goldDark}`, padding: "1px 8px", letterSpacing: "0.06em" }}>{tag}</span>
                        ))}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Cancel */}
              <div style={{ borderTop: `1px solid ${T.goldDark}40`, padding: "8px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
                <motion.button whileHover={{ color: T.textGold }} onClick={() => { setHand((h) => [...h, choosingPowerCard!]); setPlayerPlayed(null); setChoosingPowerCard(null); if (tutorialStep === 3) setTutorialStep(2); }} style={{ background: "none", border: "none", borderRadius: 0, fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim, cursor: "pointer", letterSpacing: "0.08em", padding: "4px 16px" }}>
                  {"\u25C6"} CANCELAR {"\u2014"} VOLTAR PRA MÃO {"\u25C6"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ CARD PREVIEW MODAL ══════════════ */}
      <AnimatePresence>
        {previewCard && <CardPreviewModal def={previewCard} onClose={() => setPreviewCard(null)} />}
      </AnimatePresence>

      {/* ══════════════ TUTORIAL OVERLAY ══════════════ */}
      {/* Step 3 is rendered as a banner inside the power picker — no separate overlay needed */}
      <AnimatePresence>
        {tutorialStep !== null && tutorialStep !== 3 && introStage === "done" && (() => {
          const step = TUTORIAL_STEPS[tutorialStep];
          const isLast = tutorialStep === TUTORIAL_STEPS.length - 1;
          const isInfo = step.mode === "info";

          /* ── INFO step: full blocking modal ── */
          if (isInfo) return (
            <motion.div
              key={`tutorial-info-${tutorialStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0, zIndex: 400,
                background: "rgba(0,0,0,0.82)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "16px", pointerEvents: "none",
              }}
            >
              <motion.div
                key={tutorialStep}
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                style={{
                  pointerEvents: "all",
                  width: "100%", maxWidth: 480,
                  background: T.panel,
                  border: `1.5px solid ${T.gold}`,
                  boxShadow: `0 0 0 3px ${T.black}, 0 0 0 5px ${T.goldDark}50, 0 0 60px ${T.goldGlow}, 0 24px 80px rgba(0,0,0,0.9)`,
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: -1, left: -1, zIndex: 2 }}><CornerOrnament rotate={0}/></div>
                <div style={{ position: "absolute", top: -1, right: -1, zIndex: 2 }}><CornerOrnament rotate={90}/></div>
                <div style={{ position: "absolute", bottom: -1, right: -1, zIndex: 2 }}><CornerOrnament rotate={180}/></div>
                <div style={{ position: "absolute", bottom: -1, left: -1, zIndex: 2 }}><CornerOrnament rotate={270}/></div>
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(45deg, ${T.gold}06 0px, ${T.gold}06 1px, transparent 1px, transparent 24px), repeating-linear-gradient(-45deg, ${T.gold}06 0px, ${T.gold}06 1px, transparent 1px, transparent 24px)` }} />
                <div style={{ padding: "14px 20px 10px", borderBottom: `1px solid ${T.goldDark}50`, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CrosshairIcon size={12} color={T.gold} />
                    <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", fontWeight: "var(--font-weight-bold)", color: T.textGold, letterSpacing: "0.12em" }}>GUIA DO JOGO</span>
                    <CrosshairIcon size={12} color={T.gold} />
                  </div>
                  <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim, letterSpacing: "0.06em" }}>{tutorialStep + 1} / {TUTORIAL_STEPS.length}</span>
                </div>
                <div style={{ padding: "16px 20px 12px", position: "relative", zIndex: 1 }}>
                  <GoldDivider />
                  <h3 style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-h3)", fontWeight: "var(--font-weight-bold)", color: T.textGold, margin: "12px 0 8px", letterSpacing: "0.08em", textShadow: `0 0 16px ${T.goldGlow}` }}>{step.title}</h3>
                  {step.body.split("\n").map((line, i) => (
                    <p key={i} style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-p)", color: T.textSilver, margin: "0 0 6px", lineHeight: 1.55 }}>{line}</p>
                  ))}
                  <div style={{ marginTop: 10 }}><GoldDivider /></div>
                </div>
                <div style={{ padding: "10px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                  <motion.button whileHover={{ color: T.textGold }} onClick={skipTutorial} style={{ background: "none", border: "none", fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim, cursor: "pointer", letterSpacing: "0.08em", padding: "4px 0" }}>
                    {"\u25C6"} Pular Guia
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${T.goldGlow}` }}
                    whileTap={{ scale: 0.96 }}
                    onClick={isLast ? skipTutorial : nextTutorial}
                    style={{ background: "transparent", border: `1.5px solid ${T.gold}`, borderRadius: 0, padding: "8px 28px", fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", fontWeight: "var(--font-weight-bold)", color: T.textGold, cursor: "pointer", letterSpacing: "0.1em", boxShadow: `inset 0 1px 0 ${T.gold}30, 0 0 12px ${T.goldGlow}` }}
                  >
                    {isLast ? "Vamos lá! ⚔️" : "Próximo →"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          );

          /* ── ACTION step: slim non-blocking hint banner ── */
          const atTop = step.align === "top";
          return (
            <motion.div
              key={`tutorial-action-${tutorialStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0, zIndex: 400,
                pointerEvents: "none",
                display: "flex", flexDirection: "column",
                alignItems: "center",
                justifyContent: atTop ? "flex-start" : "flex-end",
                padding: atTop ? "70px 16px 0" : "0 16px 110px",
              }}
            >
              <motion.div
                key={tutorialStep}
                initial={{ opacity: 0, y: atTop ? -20 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: atTop ? -16 : 16 }}
                transition={{ type: "spring", stiffness: 280, damping: 26 }}
                style={{
                  pointerEvents: "all",
                  width: "100%", maxWidth: 520,
                  background: `${T.panel}f2`,
                  border: `1.5px solid ${T.gold}`,
                  boxShadow: `0 0 0 2px ${T.black}, 0 0 30px ${T.goldGlow}, 0 8px 40px rgba(0,0,0,0.8)`,
                  padding: "10px 16px 10px 18px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", fontWeight: "var(--font-weight-bold)", color: T.textGold, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{step.title}</span>
                  {step.actionHint && (
                    <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textSilver, letterSpacing: "0.04em" }}>— {step.actionHint}</span>
                  )}
                </div>
                <motion.button
                  whileHover={{ color: T.textGold }}
                  onClick={skipTutorial}
                  style={{ background: "none", border: "none", fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim, cursor: "pointer", letterSpacing: "0.08em", padding: "4px 0", flexShrink: 0 }}
                >
                  {"\u25C6"} Pular Guia
                </motion.button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ══════════════ MAIN BOARD ══════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={introStage === "done" ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 60, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1.2, delay: 0.1 }}
        style={{ width: "100%", maxWidth: isMobile ? "100%" : 900, display: "flex", flexDirection: "column", gap: 0, position: "relative", zIndex: 1 }}
      >

        {/* Outer frame borders */}
        {!isMobile && (
          <>
            <div style={{ position: "absolute", inset: -6, border: `1px solid ${T.goldDark}50`, pointerEvents: "none", zIndex: 0 }} />
            <div style={{ position: "absolute", inset: -10, border: `1px solid ${T.goldDark}25`, pointerEvents: "none", zIndex: 0 }} />
          </>
        )}

        {/* Corner icons - hidden on mobile */}
        {!isMobile && (
          <>
            <div style={{ position: "absolute", top: -44, left: -44, zIndex: 10, opacity: 0.55, filter: `drop-shadow(0 0 8px ${T.goldGlow})` }}><GearsIcon size={90} /></div>
            <div style={{ position: "absolute", top: -44, right: -44, zIndex: 10, opacity: 0.55, filter: `drop-shadow(0 0 8px ${T.goldGlow})` }}><DragonIcon size={90} /></div>
            <div style={{ position: "absolute", bottom: -30, left: -30, zIndex: 10, opacity: 0.55, filter: `drop-shadow(0 0 8px ${T.goldGlow})` }}><SoccerBallIcon size={60} /></div>
            <div style={{ position: "absolute", bottom: -38, right: -48, zIndex: 10, opacity: 0.55, filter: `drop-shadow(0 0 8px ${T.goldGlow})` }}><RifleIcon size={110} /></div>
          </>
        )}

        {!isMobile && (
          <>
            <SideRailOrnament side="left" />
            <SideRailOrnament side="right" />
          </>
        )}

        {/* TITLE HEADER */}
        <div style={{ background: T.panelInner, border: `1.5px solid ${T.gold}`, borderBottom: "none", padding: isMobile ? "10px 16px 8px" : "14px 24px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: isMobile ? 6 : 8, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 300, height: 120, pointerEvents: "none" }}>
            <svg width="300" height="120" viewBox="0 0 300 120" style={{ opacity: 0.06 }}>
              {Array.from({ length: 12 }).map((_, i) => { const a = (i * 15 - 82.5) * Math.PI / 180; return <line key={i} x1="150" y1="100" x2={150 + Math.cos(a) * 200} y2={100 + Math.sin(a) * 200} stroke={T.gold} strokeWidth="1" />; })}
            </svg>
          </div>
          <img src={logoImg} alt="SVP Logo" draggable={false} style={{ width: isMobile ? 48 : 72, height: isMobile ? 48 : 72, objectFit: "contain", filter: `drop-shadow(0 0 16px ${T.goldGlow})`, position: "relative", zIndex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, width: "100%", position: "relative", zIndex: 1 }}>
            {!isMobile && <div style={{ flex: 1 }}><GoldDivider /></div>}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <h3 style={{ fontFamily: "'Market Sans', sans-serif", fontSize: isMobile ? "var(--text-label)" : "var(--text-h3)", fontWeight: "var(--font-weight-bold)", margin: 0, color: T.textGold, letterSpacing: "0.14em", textShadow: `0 0 20px ${T.goldGlow}` }}>SVP TRADING CARD GAME</h3>
              {!isMobile && <p style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim, margin: 0, letterSpacing: "0.08em" }}>PRIMEIRA EDIÇÃO  {"\u00B7"}  {"\u00A9"}2026  {"\u00B7"}  ARTE POR GABRIEL ROCHA</p>}
            </div>
            {!isMobile && <div style={{ flex: 1 }}><GoldDivider /></div>}
          </div>
        </div>

        {/* ENEMY ROW */}
        <FighterRow label={"\uD83D\uDC79 DARK OVERLORD"} hp={enemyHP} maxHp={MAX_ENEMY_HP} emoji={"\uD83D\uDC79"} hpVariant="silver" statusText={phase === "enemy-turn" ? "\u26A1 ATACANDO..." : "AGUARDANDO..."} shake={enemyShake} isEnemy={true} isMobile={isMobile} />

        {/* ENEMY ACTION BAR — shows what card+power the enemy used */}
        <EnemyActionBar action={enemyAction} />

        {/* BATTLEFIELD */}
        <div style={{
          background: `radial-gradient(ellipse at center, #0f0c00 0%, ${T.panelInner} 100%)`,
          border: `1.5px solid ${T.gold}`, borderTop: "none", borderBottom: "none",
          padding: isMobile ? "12px 8px" : "24px 32px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 16 : 40,
          minHeight: isMobile ? 160 : 240, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(45deg, ${T.gold}06 0px, ${T.gold}06 1px, transparent 1px, transparent 28px), repeating-linear-gradient(-45deg, ${T.gold}06 0px, ${T.gold}06 1px, transparent 1px, transparent 28px)` }} />
          <ArtDecoArchOverlay />
          <div style={{ position: "absolute", inset: 8, border: `0.5px solid ${T.gold}15`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 14, border: `0.5px solid ${T.gold}0a`, pointerEvents: "none" }} />

          {/* Enemy slot */}
          <PlayedCardSlot card={enemyPlayed} label="CAMPO INIMIGO" isMobile={isMobile} />

          {/* VS pillar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 1 }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,0 14,7 7,14 0,7" fill={T.gold} opacity="0.5" /></svg>
            <motion.div animate={{ boxShadow: [`0 0 10px ${T.goldGlow}`, `0 0 28px ${T.goldGlow}`, `0 0 10px ${T.goldGlow}`] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ width: isMobile ? 40 : 60, height: isMobile ? 40 : 60, background: `radial-gradient(circle at 40% 35%, #1a1000, #0a0800)`, border: `1.5px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Market Sans', sans-serif", fontWeight: "var(--font-weight-bold)", fontSize: isMobile ? 14 : 18, color: T.textGold, letterSpacing: "0.05em" }}>VS</motion.div>
            <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,0 14,7 7,14 0,7" fill={T.gold} opacity="0.5" /></svg>
          </div>

          {/* Player slot — drop zone */}
          <PlayedCardSlot card={playerPlayed} label="SEU CAMPO" isDropZone={isPlayerTurn && !playerPlayed} dropRef={dropZoneRef} isDragHovering={isDragHover} isMobile={isMobile} />
        </div>

        {/* PLAYER ROW */}
        <FighterRow label={"\uD83E\uDDD1\u200D\uD83C\uDFAE COMANDANTE"} hp={playerHP} maxHp={MAX_PLAYER_HP} emoji={"\uD83E\uDDD1\u200D\uD83C\uDFAE"} hpVariant="gold" statusText={isPlayerTurn ? "\u2726 SUA VEZ" : "\u23F3 AGUARDE"} shake={playerShake} isEnemy={false} isMobile={isMobile} />

        {/* LOG */}
        <div style={{ borderTop: "none" }}><LogPanel logs={logs} /></div>

        {/* HAND + DECK */}
        <div style={{ background: T.panelInner, border: `1.5px solid ${T.gold}`, borderTop: "none", padding: isMobile ? "12px 16px 12px" : "20px 24px 16px", display: "flex", alignItems: "flex-end", gap: isMobile ? 12 : 24, flexDirection: isMobile ? "column" : "row", position: "relative", zIndex: isDraggingCard ? 200 : "auto", overflow: isDraggingCard ? "visible" : "hidden" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, flex: 1, width: "100%", transition: "box-shadow 0.4s", boxShadow: tutorialStep === 2 ? `0 0 0 2px ${T.gold}, 0 0 24px ${T.goldGlow}` : undefined }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <CrosshairIcon size={14} color={T.gold} />
              <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textGold, letterSpacing: "0.1em", fontWeight: "var(--font-weight-bold)" }}>MÃO ({hand.length}/5)</span>
              <CrosshairIcon size={14} color={T.gold} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: isMobile ? 6 : 8, width: "100%", minHeight: isMobile ? 130 : 190, paddingBottom: 4, overflowX: isDraggingCard ? "visible" : (isMobile ? "auto" : "visible"), overflowY: isDraggingCard ? "visible" : "hidden" }}>
              <AnimatePresence>
                {hand.map((card) => (
                  <DraggableCardView
                    key={card.uid}
                    card={card}
                    onDragPlay={handleDragPlay}
                    disabled={!isPlayerTurn || !!choosingPowerCard}
                    dropZoneRef={dropZoneRef}
                    isMobile={isMobile}
                    onDragStateChange={setIsDraggingCard}
                    onPreview={setPreviewCard}
                  />
                ))}
              </AnimatePresence>
              {hand.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.4 }}>
                  <CrosshairIcon size={32} color={T.gold} />
                  <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textGold }}>MÃO VAZIA</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, borderLeft: isMobile ? "none" : `1px solid ${T.goldDark}50`, borderTop: isMobile ? `1px solid ${T.goldDark}50` : "none", paddingLeft: isMobile ? 0 : 20, paddingTop: isMobile ? 8 : 0, flexShrink: 0, width: isMobile ? "100%" : "auto", transition: "box-shadow 0.4s", boxShadow: tutorialStep === 5 ? `0 0 0 2px ${T.gold}, 0 0 24px ${T.goldGlow}` : undefined }}>
            <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textGold, letterSpacing: "0.1em", fontWeight: "var(--font-weight-bold)" }}>BARALHO</span>
            <DeckStack count={deck.length} onDraw={drawCard} canDraw={isPlayerTurn && deck.length > 0 && hand.length < 5} isMobile={isMobile} />
            <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim, textAlign: "center" }}>
              {isPlayerTurn && deck.length > 0 && hand.length < 5 ? "CLIQUE PARA COMPRAR" : hand.length >= 5 ? "MÃO CHEIA" : "BARALHO VAZIO"}
            </span>
          </div>
        </div>

        {/* FOOTER HINT */}
        <div style={{ background: T.black, border: `1.5px solid ${T.gold}`, borderTop: `1px solid ${T.goldDark}40`, padding: "6px 20px", textAlign: "center" }}>
          <span style={{ fontFamily: "'Market Sans', sans-serif", fontSize: "var(--text-label)", color: T.textDim, letterSpacing: "0.06em" }}>
            {choosingPowerCard
              ? "\u25C6  ESCOLHA O PODER A DESENCADEAR  \u25C6"
              : isPlayerTurn
              ? isMobile ? "\u25C6  TOQUE UMA CARTA PARA JOGÁ-LA  \u25C6" : "\u25C6  ARRASTE UMA CARTA PARA O SEU CAMPO  \u25C6"
              : phase === "enemy-turn"
              ? "\u25C6  DARK OVERLORD ESTÁ FAZENDO SUA JOGADA...  \u25C6"
              : "\u25C6  AGUARDE  \u25C6"}
          </span>
        </div>

      </motion.div>
    </div>
  );
}
