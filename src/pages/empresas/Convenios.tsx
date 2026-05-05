import { Link } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Phone } from "lucide-react";

const Convenios = () => {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl flex items-center justify-between py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <section className="container max-w-3xl py-20">
        <Building2 className="h-12 w-12 text-primary mb-6" />
        <h1 className="font-display text-4xl text-foreground mb-4">Convênios Corporativos</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Sua empresa pode oferecer condições exclusivas de bem-estar e autocuidado para todos os colaboradores no
          NGHair.
        </p>

        <div className="space-y-4 mb-12">
          <div className="border border-border rounded-2xl p-6 bg-card">
            <h2 className="font-display text-xl mb-2">Como funciona</h2>
            <p className="text-sm text-muted-foreground">
              Firmamos parceria com sua empresa e oferecemos descontos exclusivos a colaboradores em todos os serviços
              do salão, com agendamento facilitado e atendimento prioritário.
            </p>
          </div>
          <div className="border border-border rounded-2xl p-6 bg-card">
            <h2 className="font-display text-xl mb-2">Benefícios</h2>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Tabela de preços diferenciada para colaboradores</li>
              <li>Portal exclusivo da empresa</li>
              <li>Agendamento simplificado</li>
              <li>Relatórios mensais de utilização</li>
            </ul>
          </div>
        </div>

        <div className="border border-primary/30 rounded-2xl p-8 bg-primary/5">
          <h2 className="font-display text-2xl mb-4">Quer firmar parceria?</h2>
          <p className="text-sm text-muted-foreground mb-6">Entre em contato com nossa equipe comercial.</p>
          <div className="space-y-3">
            <a
              href="mailto:contato@nghair.com.br"
              className="flex items-center gap-3 text-foreground hover:text-primary"
            >
              <Mail className="h-4 w-4" /> contato@nghair.com.br
            </a>
            <a
              href="https://wa.me/5511947962201?text=Olá! Gostaria de mais informações sobre os convênios corporativos             target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-foreground hover:text-primary"
            >
              <Phone className="h-4 w-4" /> WhatsApp comercial
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Convenios;
