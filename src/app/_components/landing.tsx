import Link from "next/link"
import { ArrowRight, Dumbbell, HeartPulse, Hourglass, Repeat, ShieldCheck, Trophy } from "lucide-react"
import { FaixaRolante } from "@/components/faixa-rolante"
import { Marca } from "@/components/marca"
import { Taca } from "@/components/taca"
import { categoriaTaca } from "@/lib/tacas"

// Landing pública (visitante sem login). Estilo "álbum de adesivos": faixas de cor alternadas,
// título gigante e espremido, adesivos girados, pílulas pretas. Sem gradiente, sem sombra.

const contorno = "border border-black"
const botaoCheio = "pilula pilula-cheia !px-6 !py-4 text-base"
const botaoFantasma = "pilula pilula-fantasma !px-6 !py-4 text-base"

function Adesivo({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span aria-hidden="true" className={`absolute ${contorno} ${className}`}>
      {children}
    </span>
  )
}

function Secao({ fundo, id, children }: { fundo: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="px-5 py-16 sm:py-24" style={{ background: fundo }}>
      <div className="mx-auto max-w-5xl">{children}</div>
    </section>
  )
}

const PASSOS = [
  { n: "1", cor: "var(--sol)", titulo: "Digite", texto: "Quantas flecas você pagou? Escreva o número ou use os atalhos 10, 20, 30 e 50.", giro: "-rotate-1" },
  { n: "2", cor: "var(--menta)", titulo: "Aperte", texto: "O botão gigante PAGUEI! registra a série na hora. Errou o número? Dá para desfazer.", giro: "rotate-1" },
  { n: "3", cor: "var(--lavanda)", titulo: "Comemore", texto: "Bateu recorde do dia, da semana, do mês ou do ano? Chove confete e você ganha uma taça.", giro: "-rotate-1" },
]

const MOTIVOS = [
  {
    icone: Repeat,
    cor: "var(--menta)",
    titulo: "Constância vence intensidade",
    texto: "Um treino heroico por mês não muda nada. Dez flecas todo dia viram um hábito — e o hábito é o que sustenta a evolução.",
  },
  {
    icone: Hourglass,
    cor: "var(--sol)",
    titulo: "Zero desculpa",
    texto: "Sem academia, sem equipamento, sem roupa especial. Dez flecas levam menos de um minuto: cabe na manhã, no intervalo ou antes de dormir.",
  },
  {
    icone: Dumbbell,
    cor: "var(--lavanda)",
    titulo: "Força de verdade",
    texto: "A flexão trabalha peito, ombros, tríceps e o abdômen que segura o corpo reto. Um dos exercícios mais completos que existem — só com o peso do corpo.",
  },
  {
    icone: HeartPulse,
    cor: "var(--marca)",
    titulo: "O corpo se adapta ao que você repete",
    texto: "Estímulo frequente e aumento gradual é a receita básica da força. Quem aparece todos os dias vai, aos poucos, pagando mais.",
  },
]

const NIVEIS = [1, 4, 8, 13, 19, 27] // um de cada categoria: Bronze → Lendária

export function Landing() {
  return (
    <div className="flex min-h-dvh flex-col">
      <FaixaRolante />

      {/* Topo */}
      <header className="px-5 py-4" style={{ background: "var(--lavado)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Marca />
          <nav className="flex items-center gap-2">
            <Link href="/login" className="pilula pilula-fantasma">Entrar</Link>
            <span className="hidden sm:block">
              <Link href="/cadastro" className="pilula pilula-cheia">Criar conta</Link>
            </span>
          </nav>
        </div>
      </header>

      {/* 1. Hero */}
      <section className="relative overflow-hidden px-5 pt-10 pb-20 text-center sm:pt-16 sm:pb-28" style={{ background: "var(--lavado)" }}>
        <div className="relative mx-auto max-w-5xl">
          <Adesivo className="display -top-2 left-0 flex h-16 w-16 rotate-[-14deg] items-center justify-center rounded-full bg-[var(--sol)] text-2xl sm:left-10 sm:h-24 sm:w-24 sm:text-4xl">10</Adesivo>
          <Adesivo className="rotulo top-[150px] right-0 rotate-[10deg] rounded-full bg-[var(--menta)] px-4 py-2 sm:top-[300px] sm:right-16 sm:text-sm">Selva!</Adesivo>
          <Adesivo className="top-[190px] left-3 h-9 w-9 rotate-12 rounded-[10px] bg-[var(--brasa)] sm:top-[330px] sm:left-20 sm:h-12 sm:w-12">{null}</Adesivo>

          <h1 className="display pt-16 text-[84px] sm:pt-20 sm:text-[190px]">
            Pague
            <br />
            Dez
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-xl font-bold sm:text-2xl">
            A ordem do sargento virou hábito: registre suas flecas, bata recordes e conquiste taças.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/cadastro" className={botaoCheio}>
              Criar minha conta <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="#como-funciona" className={botaoFantasma}>Como funciona</Link>
          </div>
        </div>
      </section>

      {/* 2. O que é */}
      <Secao fundo="var(--papel)">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <h2 className="display text-[56px] sm:text-[88px]">
            Todo milico
            <br />
            conhece.
          </h2>
          <div className="space-y-4 text-lg font-medium">
            <p>
              Errou? <strong>Pague dez!</strong> O sargento manda e o soldado desce no chão, sem discutir. Flexão de braço — a
              &ldquo;fleca&rdquo; — é o castigo mais famoso do quartel e, ironicamente, um dos melhores exercícios que existem.
            </p>
            <p>
              O <strong>Pague Dez</strong> pega essa ideia e vira o jogo: em vez de castigo, é <strong>desafio</strong>. Você anota
              quantas flecas pagou, o app soma tudo e te mostra se você está evoluindo. Simples, rápido e viciante.
            </p>
            <p className={`${contorno} inline-block rounded-full bg-[var(--sol)] px-4 py-2 text-base font-bold`}>
              Feito para quem é militar, ex-militar ou só quer ficar forte.
            </p>
          </div>
        </div>
      </Secao>

      {/* 3. Como funciona */}
      <Secao fundo="var(--nevoa)" id="como-funciona">
        <h2 className="display mb-10 text-[56px] sm:text-[88px]">Como funciona</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {PASSOS.map((p) => (
            <li key={p.n} className={`rounded-[20px] ${contorno} p-6 ${p.giro}`} style={{ background: p.cor }}>
              <span className={`display flex h-14 w-14 items-center justify-center rounded-full ${contorno} bg-white text-2xl`}>{p.n}</span>
              <h3 className="display mt-4 text-4xl">{p.titulo}</h3>
              <p className="mt-3 font-medium">{p.texto}</p>
            </li>
          ))}
        </ol>

        <div className={`mt-6 grid gap-3 rounded-[20px] ${contorno} bg-white p-6 sm:grid-cols-4`}>
          {[
            ["Hoje", "var(--marca)"],
            ["Semana", "var(--menta)"],
            ["Mês", "var(--lavanda)"],
            ["Ano", "var(--sol)"],
          ].map(([nome, cor]) => (
            <div key={nome} className={`rounded-full ${contorno} px-4 py-3 text-center`} style={{ background: cor }}>
              <span className="rotulo">Recorde {nome}</span>
            </div>
          ))}
          <p className="font-medium sm:col-span-4">
            O app acompanha <strong>quatro recordes</strong> ao mesmo tempo. Um único registro pode bater vários de uma vez — e aí a festa é grande.
          </p>
        </div>
      </Secao>

      {/* 4. Taças */}
      <Secao fundo="var(--lavado)">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-[56px] sm:text-[88px]">
            Taças que
            <br />
            só crescem
          </h2>
          <Trophy className="hidden h-24 w-24 sm:block" aria-hidden="true" />
        </div>
        <p className="mb-8 max-w-2xl text-lg font-medium">
          Sua primeira flexão já vale a taça <strong>Recruta</strong>. Daí em diante, cada recorde rende uma taça <strong>maior e mais bonita</strong> que
          a anterior: Bronze, Prata, Ouro, Platina, Diamante e, no topo, a Lendária. Você <em>vê</em> a sua evolução na estante.
        </p>
        <ul className={`grid grid-cols-3 items-end gap-4 rounded-[40px] ${contorno} bg-white p-6 sm:grid-cols-6`}>
          {NIVEIS.map((nivel) => {
            const { nome } = categoriaTaca(nivel, "DIARIO")
            return (
              <li key={nivel} className="flex flex-col items-center justify-end text-center">
                <Taca nivel={nivel} tipo="DIARIO" tamanho={40} />
                <span className="rotulo mt-2">{nome}</span>
              </li>
            )
          })}
        </ul>
      </Secao>

      {/* 5. Por que todo dia */}
      <Secao fundo="var(--papel)" id="por-que">
        <h2 className="display text-[56px] sm:text-[88px]">
          Por que
          <br />
          todo dia?
        </h2>
        <p className="mt-6 mb-10 max-w-2xl text-lg font-medium">
          Porque o segredo nunca foi o treino perfeito — é <strong>não faltar</strong>. Quem paga um pouquinho todo dia constrói o que
          o &ldquo;vou começar na segunda&rdquo; nunca constrói.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {MOTIVOS.map(({ icone: Icone, cor, titulo, texto }, i) => (
            <li key={titulo} className={`rounded-[20px] ${contorno} p-6 ${i % 2 === 0 ? "-rotate-1" : "rotate-1"}`} style={{ background: cor }}>
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${contorno} bg-white`}>
                <Icone className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-2xl font-bold leading-tight">{titulo}</h3>
              <p className="mt-2 font-medium">{texto}</p>
            </li>
          ))}
        </ul>
        <p className={`mt-8 rounded-[20px] ${contorno} bg-[var(--sol)] p-5 text-center text-lg font-bold`}>
          Dez flecas por dia = mais de 3.600 por ano. Sem academia, sem mensalidade.
        </p>
      </Secao>

      {/* 6. Jogo limpo */}
      <Secao fundo="var(--lavanda)">
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
          <span className={`flex h-28 w-28 items-center justify-center rounded-full ${contorno} bg-white sm:h-36 sm:w-36`}>
            <ShieldCheck className="h-14 w-14 sm:h-20 sm:w-20" />
          </span>
          <div>
            <h2 className="display text-[48px] sm:text-[72px]">Jogo limpo</h2>
            <p className="mt-4 max-w-2xl text-lg font-medium">
              Aqui ninguém vira lenda apertando botão dez mil vezes. O app tem <strong>travas contra trapaça</strong>: intervalo entre registros,
              limite de séries seguidas e teto por série e por dia. Respeita o descanso, respeita a tropa — e o seu recorde vale de verdade.
            </p>
          </div>
        </div>
      </Secao>

      {/* 7. Azul ou rosa + CTA final */}
      <section className="relative overflow-hidden px-5 py-20 text-center sm:py-28" style={{ background: "var(--lavado)" }}>
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 flex justify-center gap-3">
            <span className={`rotulo rounded-full ${contorno} bg-[var(--eletrico)] px-4 py-2`}>Quartel azul</span>
            <span className={`rotulo rounded-full ${contorno} bg-[var(--chiclete)] px-4 py-2`}>Quartel rosa</span>
          </div>
          <h2 className="display text-[64px] sm:text-[130px]">
            Pague dez.
            <br />
            Agora.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg font-bold">
            Sua conta leva um minuto e a primeira taça sai com a primeira fleca. O sargento está esperando.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/cadastro" className={botaoCheio}>
              Alistar-se agora <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/login" className={botaoFantasma}>Já sou da tropa</Link>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-black px-5 py-8 text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="display text-xl">Pague Dez</span>
          <p className="max-w-xl text-white/70">
            Atividade física é por sua conta e risco. Se tem alguma condição de saúde, converse com um profissional antes de treinar.
          </p>
        </div>
      </footer>
    </div>
  )
}
