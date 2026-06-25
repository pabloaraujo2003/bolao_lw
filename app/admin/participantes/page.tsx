import { createClient } from '@/lib/supabase/server'
import { PaymentToggle } from './PaymentToggle'

export default async function AdminParticipantesPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, paid, created_at')
    .order('name')

  const { data: settings } = await supabase.from('settings').select('key, value')
  const s: Record<string, string> = {}
  settings?.forEach((r) => (s[r.key] = r.value))
  const entryFee = parseFloat(s.entry_fee ?? '50')
  const totalPaid = profiles?.filter((p) => p.paid).length ?? 0
  const totalPool = totalPaid * entryFee

  return (
    <div>
      {/* Header */}
      <div className="fade-1" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="display" style={{ fontSize: '2rem', color: 'var(--text)', marginBottom: '.2rem' }}>Participantes</h2>
          <p style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
            {profiles?.length ?? 0} cadastrados
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="card" style={{ padding: '10px 16px', textAlign: 'center', minWidth: '100px' }}>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green)', marginBottom: '2px' }}>
              {totalPaid}
            </div>
            <div style={{ fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pagos</div>
          </div>
          <div className="card" style={{ padding: '10px 16px', textAlign: 'center', minWidth: '120px' }}>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--amber)', marginBottom: '2px' }}>
              R$ {totalPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Arrecadado</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="fade-2 card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto auto',
          padding: '10px 20px', borderBottom: '1px solid var(--border)',
          fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.07em', textTransform: 'uppercase', fontWeight: 600,
          background: 'var(--s2)',
        }}>
          <span>Nome</span>
          <span style={{ textAlign: 'right', marginRight: '60px' }}>Cadastro</span>
          <span style={{ textAlign: 'center', minWidth: '100px' }}>Pagamento</span>
        </div>

        {profiles?.length ? profiles.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              alignItems: 'center', padding: '13px 20px',
              borderBottom: i < profiles.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background .1s',
            }}
          >
            <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '.88rem' }}>
              {p.name}
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginRight: '20px' }}>
              {new Date(p.created_at).toLocaleDateString('pt-BR')}
            </div>
            <div style={{ minWidth: '100px', display: 'flex', justifyContent: 'center' }}>
              <PaymentToggle userId={p.id} paid={p.paid} />
            </div>
          </div>
        )) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.9rem' }}>
            Nenhum participante cadastrado.
          </div>
        )}
      </div>
    </div>
  )
}
