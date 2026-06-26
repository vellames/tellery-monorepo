export default function PrivacyPage() {
  return (
    <main className="bg-background text-foreground mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading text-primary text-3xl font-bold tracking-tight">
        Política de Privacidade
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Última atualização: junho de 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            1. Informações que coletamos
          </h2>
          <p className="text-muted-foreground">
            Coletamos o nome e o e-mail informados no cadastro, além de dados de
            uso (como as histórias e sessões que você inicia) necessários para
            o funcionamento do serviço.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            2. Como usamos seus dados
          </h2>
          <p className="text-muted-foreground">
            Utilizamos suas informações para criar e manter sua conta, fornecer
            a experiência interativa e melhorar o produto. Não vendemos seus
            dados.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            3. Compartilhamento
          </h2>
          <p className="text-muted-foreground">
            Compartilhamos dados apenas com provedores necessários para operar o
            serviço (como hospedagem e modelos de linguagem), sob acordos de
            confidencialidade.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            4. Seus direitos
          </h2>
          <p className="text-muted-foreground">
            Você pode solicitar acesso, correção ou exclusão dos seus dados a
            qualquer momento. Para isso, entre em contato pelo e-mail indicado
            abaixo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">5. Contato</h2>
          <p className="text-muted-foreground">
            Em caso de dúvidas sobre esta política, escreva para
            privacidade@tellery.app.
          </p>
        </section>
      </div>
    </main>
  );
}
