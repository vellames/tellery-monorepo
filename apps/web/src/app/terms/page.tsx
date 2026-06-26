export default function TermsPage() {
  return (
    <main className="bg-background text-foreground mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading text-primary text-3xl font-bold tracking-tight">
        Termos de Uso
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Última atualização: junho de 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            1. Aceitação dos termos
          </h2>
          <p className="text-muted-foreground">
            Ao criar uma conta e utilizar o Tellery, você concorda com estes
            Termos de Uso. Caso não concorde, não utilize o serviço.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            2. Uso do serviço
          </h2>
          <p className="text-muted-foreground">
            O Tellery oferece histórias interativas para entretenimento. Você
            concorda em usar o serviço de forma lícita e em não prejudicar a
            operação ou outros usuários.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            3. Conta do usuário
          </h2>
          <p className="text-muted-foreground">
            Você é responsável pela precisão dos dados informados no cadastro e
            pela segurança das suas credenciais. Podemos suspender contas que
            violem estes termos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            4. Alterações
          </h2>
          <p className="text-muted-foreground">
            Podemos atualizar estes termos a qualquer tempo. Continuar usando o
            serviço após mudanças indica aceitação da nova versão.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            5. Contato
          </h2>
          <p className="text-muted-foreground">
            Dúvidas sobre estes termos podem ser enviadas para
            juridico@tellery.app.
          </p>
        </section>
      </div>
    </main>
  );
}
