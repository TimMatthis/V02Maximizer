import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

type Item = { name: string; value: number }

type Props = { width?: number; height?: number; items: Item[]; base?: number }

export default function ForcePlot({ items, width = 560, height = 220 }: Props) {
  const ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const svg = d3.select(ref.current!)
    svg.selectAll('*').remove()

    const margin = { top: 16, right: 16, bottom: 24, left: 16 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const maxAbs = d3.max(items, (d: any) => Math.abs(d.value)) || 1
    const x = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([0, innerW])

    // Baseline center line
    g.append('line')
      .attr('x1', x(0))
      .attr('x2', x(0))
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', '#6B7280')
      .attr('stroke-dasharray', '4 4')

    const rowH = Math.min(28, innerH / (items.length + 1))
    const y = (_: number, i: number) => 10 + i * rowH

    const pos = items.filter((d) => d.value >= 0)
    const neg = items.filter((d) => d.value < 0)

    // Draw bars
    function drawSide(data: Item[], dir: 'pos' | 'neg') {
      const sel = g.selectAll(`rect.${dir}`).data(data as any, (d: any) => d.name)
      sel
        .enter()
        .append('rect')
        .attr('class', dir)
        .attr('x', (d: any) => (d.value >= 0 ? x(0) : x(d.value)))
        .attr('y', (_: any, i: number) => y(0, i))
        .attr('height', rowH - 8)
        .attr('width', (d: any) => Math.abs(x(d.value) - x(0)))
        .attr('fill', (d: any) => (d.value >= 0 ? '#10B981' : '#EF4444'))

      const labels = g.selectAll(`text.${dir}`).data(data as any, (d: any) => d.name)
      labels
        .enter()
        .append('text')
        .attr('class', dir)
        .attr('x', (d: any) => (d.value >= 0 ? x(0) + 4 : x(d.value) - 4))
        .attr('y', (_: any, i: number) => y(0, i) + (rowH - 8) / 2 + 4)
        .attr('text-anchor', (d: any) => (d.value >= 0 ? 'start' : 'end'))
        .attr('fill', '#111827')
        .attr('font-size', 12)
        .text((d: any) => `${d.name} ${d.value >= 0 ? '+' : ''}${d.value.toFixed(2)}`)
    }

    drawSide(pos, 'pos')
    drawSide(neg, 'neg')
  }, [items, width, height])

  return <svg ref={ref} width="100%" height={height} role="img" aria-label="SHAP Force Plot" />
}
