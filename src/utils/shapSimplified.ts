import type { FeatureWeights, ShapContributions } from '../types'
import { mean, std } from 'mathjs'

export type TreeNode = {
  feature?: string
  threshold?: number
  leftChild?: TreeNode
  rightChild?: TreeNode
  value?: number
}

export class SimplifiedTreeSHAP {
  private baseValue: number
  private featureMeans: Record<string, number>
  private featureStds: Record<string, number>
  private personalizedWeights: FeatureWeights

  constructor(baseValue: number, featureHistory: Record<string, number[]>, personalizedWeights: FeatureWeights) {
    this.baseValue = baseValue
    this.personalizedWeights = personalizedWeights
    this.featureMeans = {}
    this.featureStds = {}
    for (const [k, arr] of Object.entries(featureHistory)) {
      this.featureMeans[k] = Number(mean(arr as number[]))
      const s = Number(std(arr as number[]))
      this.featureStds[k] = s === 0 ? 1 : s
    }
  }

  calculateShapValues(instance: FeatureWeights, backgroundMean: FeatureWeights): ShapContributions {
    const shapValues: { [key: string]: number } = {}
    ;(Object.keys(instance) as (keyof FeatureWeights)[]).forEach((feature) => {
      shapValues[feature as string] = this.calculateFeatureContribution(instance, feature, backgroundMean)
    })

    // Normalize contributions to percentages of absolute sum
    const absSum = Object.values(shapValues).reduce((a, b) => a + Math.abs(b), 0) || 1
    const features: ShapContributions['features'] = {}
    for (const [k, v] of Object.entries(shapValues)) {
      features[k] = {
        value: (instance as any)[k],
        shapValue: v,
        percentageContribution: Math.abs(v) / absSum,
      }
    }
    return { baseValue: this.baseValue, features }
  }

  private calculateFeatureContribution(instance: FeatureWeights, targetFeature: keyof FeatureWeights, backgroundMean: FeatureWeights) {
    const withFeature = { ...instance }
    const predictionWith = this.predict(withFeature)

    const withoutFeature = { ...instance, [targetFeature]: backgroundMean[targetFeature] }
    const predictionWithout = this.predict(withoutFeature as FeatureWeights)

    return predictionWith - predictionWithout
  }

  private predict(features: FeatureWeights): number {
    let prediction = this.baseValue
    for (const [feature, value] of Object.entries(features)) {
      const mu = this.featureMeans[feature] ?? 0
      const s = this.featureStds[feature] ?? 1
      const w = (this.personalizedWeights as any)[feature] ?? 0
      const normalized = ((value as number) - mu) / s
      prediction += normalized * w * 5 // scale to VO2 units
    }
    return prediction
  }
}
