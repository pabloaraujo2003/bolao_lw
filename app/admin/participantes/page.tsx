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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-lg font-bold" style={{ color: '#F0F4F8' }}>
          Participantes ({profiles?.length ?? 0})
        </h2>
        <div className="text-sm" style={{ color: '#7A8FA6' }}>
          {totalPaid} pagos · R$ {totalPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} arrecadados
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#1E2F45', color: '#7A8FA6' }}>
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Cadastro</th>
              <th className="px-4 py-3 text-center font-medium">Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid #1E2F45' }}>
                <td className="px-4 py-3 font-medium" style={{ color: '#F0F4F8' }}>{p.name}</td>
                <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: '#7A8FA6' }}>
                  {new Date(p.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-center">
                  <PaymentToggle userId={p.id} paid={p.paid} />
                </td>
              </tr>
            ))}
            {!profiles?.length && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center" style={{ color: '#7A8FA6' }}>
                  Nenhum participante cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
