import TSSV from 'tssv/lib/core/TSSV'

type inWidthType = TSSV.IntRange<1, 32>
/**
 * configuration parameters of the FIR2 module
 */
export interface FIR2_Parameters extends TSSV.TSSVParameters {
  /**
     * Array containing the coefficients of the FIR filter
     */
  coefficients: bigint[]
  /**
     * bit width of the FIR input data
     */
  inWidth?: inWidthType
  /**
     * bit width of the FIR output data
     * @remarks result will be saturated or ign extended as needed
     */
  outWidth?: TSSV.IntRange<1, 32>
  /**
     * right to apply to the FIR result to scale down the output
     */
  rShift?: TSSV.IntRange<0, 32>
}

/**
 * FIR Interface
 *
 * @wavedrom
 * ```json
 * {
 *   "signal": [
 *     {"name": "     clk", "wave": "p........."},
 *     {"name": "      en", "wave": "01.0.1.01."},
 *     {"name": " data_in", "wave": "x34..56.78", "data": ["i0", "i1", "i2", "i3", "i4", "i5"]},
 *     {"name": "data_out", "wave": "x.34..56.7", "data": ["o0", "o1", "o2", "o3", "o4", "o5"]}
 *   ]
 * }
 * ```
 */
export interface FIR2_Ports extends TSSV.IOSignals {
  clk: { direction: 'input', isClock: 'posedge' }
  rst_b: { direction: 'input', isReset: 'lowasync' }
  en: { direction: 'input' }
  data_in: { direction: 'input', width: inWidthType, isSigned: true }
  data_out: { direction: 'output', width: number, isSigned: true }
}

export class FIR2 extends TSSV.Module {
  declare params: FIR2_Parameters
  declare IOs: FIR2_Ports
  constructor (params: FIR2_Parameters) {
    super({
      // define the default parameter values
      name: params.name,
      coefficients: params.coefficients,
      inWidth: params.inWidth || 8,
      outWidth: params.outWidth || 9,
      rShift: params.rShift || 2
    })

    // define IO signals
    this.IOs = {
      clk: { direction: 'input', isClock: 'posedge' },
      rst_b: { direction: 'input', isReset: 'lowasync' },
      en: { direction: 'input' },
      data_in: { direction: 'input', width: this.params.inWidth || 8, isSigned: true },
      data_out: { direction: 'output', width: this.params.outWidth || 9, isSigned: true }
    }

    // construct logic
    let nextTapIn: TSSV.Sig = new TSSV.Sig('data_in')
    const products: TSSV.Sig[] = []
    let coeffSum = 0
    for (let i = 0; i < this.params.coefficients.length; i++) {
      // construct tap delay line
      const thisTap = this.addSignal(`tap_${i}`, { width: this.params.inWidth, isSigned: true })
      this.addRegister({ d: nextTapIn, clk: 'clk', reset: 'rst_b', en: 'en', q: thisTap })

      // construct tap multipliers
      products.push(this.addMultiplier({ a: thisTap, b: this.params.coefficients[i] }))
      coeffSum += Math.abs(Number(this.params.coefficients[i]))

      nextTapIn = thisTap
    }

    // construct final vector sum
    const sumWidth = (this.params.inWidth || 0) + this.bitWidth(coeffSum)
    const productsExt = products.map((p) => `${sumWidth}'(${p.toString()})`)
    this.addSignal('sum', { width: sumWidth, isSigned: true })
    this.addRegister({
      d: new TSSV.Expr(`${productsExt.join(' + ')}`),
      clk: 'clk',
      reset: 'rst_b',
      en: 'en',
      q: 'sum'
    })

    // round and saturate to final output
    this.addSignal('rounded', { width: sumWidth - (this.params.rShift || 0) + 1, isSigned: true })
    this.addRound({ in: 'sum', out: 'rounded', rShift: this.params.rShift || 1 })
    this.addSignal('saturated', { width: this.params.outWidth, isSigned: true })
    this.addSaturate({ in: 'rounded', out: 'saturated' })
    this.addRegister({
      d: 'saturated',
      clk: 'clk',
      reset: 'rst_b',
      en: 'en',
      q: 'data_out'
    })
  }
}

export default FIR2
