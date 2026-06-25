function emvField(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`
}

function crc16ccitt(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function buildPixPayload(
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount: string,
): string {
  const gui = emvField('00', 'br.gov.bcb.pix')
  const key = emvField('01', pixKey)
  const merchantAccount = emvField('26', gui + key)

  const txid = emvField('05', '***')
  const additionalData = emvField('62', txid)

  const name = merchantName.substring(0, 25).toUpperCase()
  const city = merchantCity.substring(0, 15).toUpperCase()
  const amountStr = parseFloat(amount).toFixed(2)

  const body =
    emvField('00', '01') +
    merchantAccount +
    emvField('52', '0000') +
    emvField('53', '986') +
    emvField('54', amountStr) +
    emvField('58', 'BR') +
    emvField('59', name) +
    emvField('60', city) +
    additionalData +
    '6304'

  return body + crc16ccitt(body)
}
