import type { FeatureWeights, PersonalizationLevel } from '../types'

export class OnlineLearningSimulator {
  private weights: FeatureWeights
  private learningRate = 0.05
  private dataPoints = 0
  private historicalMean: FeatureWeights

  constructor(initial: FeatureWeights, historicalMean: FeatureWeights) {
    this.weights = { ...initial }
    this.historicalMean = { ...historicalMean }
  }

  getWeights() {
    return { ...this.weights }
  }

  updateWeights(features: FeatureWeights, actualVO2Max: number, predictedVO2Max: number) {
    const error = actualVO2Max - predictedVO2Max
    const reward = this.calculateReward(error)

    for (const k of Object.keys(this.weights) as (keyof FeatureWeights)[]) {
      const contribution = Math.abs((features[k] as number) - (this.historicalMean[k] as number))
      const gradient = reward * contribution * error
      this.weights[k] = (this.weights[k] as number) + this.learningRate * gradient
    }

    this.normalizeWeights()
    this.dataPoints++
  }

  private normalizeWeights() {
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0)
    if (sum === 0) return
    for (const k of Object.keys(this.weights) as (keyof FeatureWeights)[]) {
      this.weights[k] = (this.weights[k] as number) / sum
    }
  }

  private calculateReward(predictionError: number) {
    return 1.0 / (1.0 + Math.abs(predictionError))
  }

  getPersonalizationLevel(): PersonalizationLevel {
    if (this.dataPoints < 14) return 'population'
    if (this.dataPoints < 30) return 'personalizing'
    return 'personalized'
  }
}

