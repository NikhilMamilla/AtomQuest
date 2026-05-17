// Progress score formulas per BRD section 2.2
export function calcScore(uom: string, target: number, achievement: number, deadline?: string, completionDate?: string): number {
  switch (uom) {
    case 'numeric_min':
    case 'percent_min':
      return achievement / target          // higher is better
    case 'numeric_max':
    case 'percent_max':
      return target / achievement          // lower is better
    case 'timeline':
      if (!deadline || !completionDate) return 0
      return new Date(completionDate) <= new Date(deadline) ? 1 : 0
    case 'zero':
      return achievement === 0 ? 1 : 0
    default:
      return 0
  }
}