import { readFile, unlink, open, constants } from 'node:fs/promises'

const { O_CREAT, O_APPEND, O_RDWR } = constants

try {
  await unlink('./decoded').catch(e => {
    if (e.code !== 'ENOENT') console.log(e)
  })
  const contents = await readFile('0038_many_register_mov')
  const fd = await open('./decoded', O_APPEND | O_CREAT | O_RDWR)
  const stream = fd.createWriteStream(O_APPEND)
  stream.write('bits 16\r\n')
  for (let i = 0; i < contents.length; i += 2) {
    const byte1 = contents[i]
    const byte2 = contents[i + 1]
    const D = byte1 & 0b00000010
    const W = byte1 & 0b00000001
    const OPCODE = byte1 >> 2
    const REG = getReg((byte2 & 0b00111000) >> 3, W)
    const R_M = getReg(byte2 & 0b00000111, W)
    // console.log(REG, R_M)
    const dest = D === 1 ? REG : R_M
    const source = dest === REG ? R_M : REG

    switch (OPCODE) {
      case 34:
        stream.write(`MOV ${dest} ${source}\r\n`)
        break
    }
  }
} catch (err) {
  console.error(err.message)
}

function getReg(number, W) {
  switch (number) {
    case 0:
      return W ? 'AX' : 'AL'
    case 1:
      return W ? 'CX' : 'CL'
    case 2:
      return W ? 'DX' : 'DL'
    case 3:
      return W ? 'BX' : 'BL'
    case 4:
      return W ? 'SP' : 'AH'
    case 5:
      return W ? 'BP' : 'CH'
    case 6:
      return W ? 'SI' : 'DH'
    case 7:
      return W ? 'DI' : 'BH'
  }
}
