export default function PrivacyPage() {
  return (
    <main className="bg-background text-foreground mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading text-primary text-3xl font-bold tracking-tight">
        Política de Privacidade
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Última atualização: 4 de julho de 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <p className="text-muted-foreground">
            Esta Política de Privacidade descreve como a{' '}
            <strong className="text-foreground">
              CODE FOR GIANTS INFORMÁTICA LTDA
            </strong>
            , inscrita no CNPJ sob o nº 53.673.319/0001-44, responsável pelo
            aplicativo Tellery (&quot;Tellery&quot;, &quot;serviço&quot; ou{' '}
            &quot;aplicativo&quot;), coleta, usa, compartilha e protege os seus
            dados pessoais. Ao criar uma conta e utilizar o Tellery, você toma
            ciência das práticas descritas abaixo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            1. Dados que coletamos
          </h2>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5">
            <li>
              <span className="text-foreground font-medium">
                Dados de cadastro:
              </span>{' '}
              nome e endereço de e-mail informados na criação da conta, além da
              senha armazenada de forma criptografada.
            </li>
            <li>
              <span className="text-foreground font-medium">Dados de uso:</span>{' '}
              histórias acessadas, sessões iniciadas e as escolhas feitas ao
              longo da experiência interativa, necessários para o funcionamento
              do serviço.
            </li>
            <li>
              <span className="text-foreground font-medium">
                Dados de pagamento:
              </span>{' '}
              informações relativas a assinaturas e planos contratados. O
              processamento do pagamento é realizado pela Stripe, e não
              armazenamos o número do seu cartão nem dados financeiros sensíveis
              em nossos servidores.
            </li>
            <li>
              <span className="text-foreground font-medium">
                Dados técnicos e de dispositivo:
              </span>{' '}
              tipo de navegador, sistema operacional, resoluções de tela e de
              janela, idioma e fuso horário do navegador, capacidade de memória
              e número de núcleos do processador, suporte a toque, densidade de
              pixels, características da conexão de rede (quando disponíveis),
              endereço IP e informações básicas de navegação, utilizados para
              segurança, estabilidade e melhoria do serviço.
            </li>
            <li>
              <span className="text-foreground font-medium">
                Dados de visitantes e análise de conversão:
              </span>{' '}
              coletamos, antes mesmo da criação da conta, um identificador
              aleatório gerado e armazenado no seu navegador, além de parâmetros
              de navegação (como origens de campanha ou links de referência),
              com a finalidade de compreender como os visitantes chegam à página
              de cadastro e em que ponto do formulário desistem, ajudando-nos a
              melhorar a experiência de uso. Esses dados não permitem, por si
              só, a identificação direta de uma pessoa.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            2. Bases legais (LGPD)
          </h2>
          <p className="text-muted-foreground">
            O tratamento dos seus dados pessoais é realizado com fundamento na
            Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD),
            principalmente nas seguintes bases: execução de contrato (para
            fornecer o serviço que você solicitou), cumprimento de obrigação
            legal ou regulatória, exercício regular de direitos e legítimo
            interesse da empresa na operação e na melhoria do aplicativo. A
            coleta de dados técnicos e de navegação de visitantes, descrita na
            seção anterior, apoia-se no legítimo interesse de analisar e
            aprimorar a experiência de uso, não envolvendo dados sensíveis.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            3. Como usamos seus dados
          </h2>
          <p className="text-muted-foreground">
            Utilizamos suas informações para: criar e manter sua conta; fornecer
            e personalizar a experiência interativa; processar pagamentos e
            gerenciar assinaturas; prevenir fraudes e garantir a segurança da
            plataforma; e melhorar continuamente o Tellery. Não vendemos os seus
            dados pessoais.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            4. Compartilhamento de dados
          </h2>
          <p className="text-muted-foreground">
            Compartilhamos dados apenas com parceiros estritamente necessários
            para operar o serviço, sempre sob acordos de confidencialidade e em
            conformidade com a LGPD:
          </p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5">
            <li>
              <span className="text-foreground font-medium">Stripe:</span>{' '}
              processamento de pagamentos e gestão de assinaturas.
            </li>
            <li>
              <span className="text-foreground font-medium">
                Provedores de modelos de linguagem:
              </span>{' '}
              geração do conteúdo interativo das histórias.
            </li>
            <li>
              <span className="text-foreground font-medium">
                Provedor de hospedagem e infraestrutura:
              </span>{' '}
              armazenamento e processamento para manter o serviço no ar.
            </li>
          </ul>
          <p className="text-muted-foreground">
            Poderemos, ainda, compartilhar dados quando exigido por lei, ordem
            judicial ou autoridade competente.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            5. Cookies e tecnologias similares
          </h2>
          <p className="text-muted-foreground">
            Utilizamos apenas cookies essenciais ao funcionamento do serviço,
            como o de sessão (que mantém você autenticado) e o de preferência de
            idioma. Não utilizamos cookies de publicidade nem de rastreamento de
            terceiros para fins de marketing. Também armazenamos, no
            armazenamento local do seu navegador (localStorage), um
            identificador aleatório que nos ajuda a agrupar a atividade de um
            mesmo navegador para análise do funil de cadastro. Esse
            identificador permanece no seu navegador até que você o apague
            manualmente por meio das configurações do navegador.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            6. Retenção e segurança
          </h2>
          <p className="text-muted-foreground">
            Mantemos seus dados pessoais pelo tempo necessário ao cumprimento
            das finalidades descritas nesta política ou conforme exigido por
            lei. Aplicamos medidas técnicas e organizacionais razoáveis para
            proteger seus dados contra acesso não autorizado, alteração ou
            divulgação, embora nenhum método de transmissão pela internet seja
            inteiramente seguro.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            7. Seus direitos (LGPD, art. 18)
          </h2>
          <p className="text-muted-foreground">
            Como titular dos dados, você pode solicitar, a qualquer momento:
            confirmação da existência de tratamento; acesso aos seus dados;
            correção de dados incompletos, inexatos ou desatualizados;
            anonimização, bloqueio ou eliminação de dados desnecessários ou
            excessivos; portabilidade dos dados; e eliminação dos dados pessoais
            tratados com o seu consentimento, bem como a revogação desse
            consentimento. Para exercer qualquer desses direitos, entre em
            contato pelo e-mail indicado na seção 9. As solicitações serão
            avaliadas e respondidas nos prazos aplicáveis previstos pela
            legislação vigente.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            8. Alterações desta política
          </h2>
          <p className="text-muted-foreground">
            Podemos atualizar esta Política de Privacidade a qualquer tempo para
            refletir mudanças nas práticas do serviço ou por motivos legais. A
            versão mais recente estará sempre disponível nesta página, com a
            data de atualização no topo. Continuar utilizando o Tellery após
            alterações indica a aceitação da versão revisada.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            9. Contato
          </h2>
          <p className="text-muted-foreground">
            Em caso de dúvidas, solicitações ou reclamações relacionadas a esta
            Política de Privacidade ou ao tratamento dos seus dados pessoais,
            entre em contato com a CODE FOR GIANTS INFORMÁTICA LTDA pelo e-mail{' '}
            <a
              href="mailto:support@codeforgiants.com"
              className="text-primary underline"
            >
              support@codeforgiants.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
