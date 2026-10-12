import {
    Chart as ChartJS,
    ChartData,
    ChartDataset,
    ChartOptions,
    Filler,
    LinearScale,
    LineElement,
    PointElement,
} from 'chart.js';
import { DeepPartial } from 'ts-essentials';
import { useState } from 'react';
import { deepmerge, deepmergeCustom } from 'deepmerge-ts';
import { theme } from 'twin.macro';
import { readToken, useTheme } from '@/components/theme/ThemeProvider';

ChartJS.register(LineElement, PointElement, Filler, LinearScale);

// Built on every render so that colours follow the active theme; canvas cannot
// read CSS variables directly.
const baseOptions = (): ChartOptions<'line'> => ({
    responsive: true,
    animation: false,
    plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: { enabled: false },
    },
    layout: {
        padding: 0,
    },
    scales: {
        x: {
            min: 0,
            max: 19,
            type: 'linear',
            grid: {
                display: false,
                drawBorder: false,
            },
            ticks: {
                display: false,
            },
        },
        y: {
            min: 0,
            type: 'linear',
            grid: {
                display: true,
                color: readToken('line'),
                drawBorder: false,
            },
            ticks: {
                display: true,
                count: 3,
                padding: 8,
                color: readToken('fg-subtle'),
                font: {
                    family: theme('fontFamily.sans'),
                    size: 10,
                    weight: '400',
                },
            },
        },
    },
    elements: {
        point: {
            radius: 0,
        },
        line: {
            tension: 0.35,
            borderWidth: 1.5,
        },
    },
});

function getOptions(opts?: DeepPartial<ChartOptions<'line'>> | undefined): ChartOptions<'line'> {
    return deepmerge(baseOptions(), opts || {});
}

// Default dataset colours by index (CSS variable names without the "--").
const defaultPalette = ['accent', 'fg-subtle'];

const colorize =
    (palette: string[]) =>
    (dataset: ChartDataset<'line'>, index: number): ChartDataset<'line'> => {
        const token = palette[index % palette.length];

        return {
            ...dataset,
            borderColor: dataset.borderColor ?? readToken(token),
            backgroundColor:
                dataset.backgroundColor ??
                ((context: { chart: ChartJS }) => {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return 'transparent';

                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, readToken(token, 0.28));
                    gradient.addColorStop(1, readToken(token, 0));

                    return gradient;
                }),
        } as ChartDataset<'line'>;
    };

type ChartDatasetCallback = (value: ChartDataset<'line'>, index: number) => ChartDataset<'line'>;

function getEmptyData(label: string, sets = 1, callback?: ChartDatasetCallback | undefined): ChartData<'line'> {
    const next = callback || ((value) => value);

    return {
        labels: Array(20)
            .fill(0)
            .map((_, index) => index),
        datasets: Array(sets)
            .fill(0)
            .map((_, index) =>
                next(
                    {
                        fill: true,
                        label,
                        data: Array(20).fill(-5),
                    },
                    index
                )
            ),
    };
}

const merge = deepmergeCustom({ mergeArrays: false });

interface UseChartOptions {
    sets: number;
    options?: DeepPartial<ChartOptions<'line'>> | number | undefined;
    callback?: ChartDatasetCallback | undefined;
    // CSS variable names used for each dataset's colour, by index.
    colors?: string[];
}

function useChart(label: string, opts?: UseChartOptions) {
    // Subscribing to the theme re-renders the chart with new colours when it changes.
    useTheme();
    const options = getOptions(
        typeof opts?.options === 'number' ? { scales: { y: { min: 0, suggestedMax: opts.options } } } : opts?.options
    );
    const [data, setData] = useState(getEmptyData(label, opts?.sets || 1, opts?.callback));

    const push = (items: number | null | (number | null)[]) =>
        setData((state) =>
            merge(state, {
                datasets: (Array.isArray(items) ? items : [items]).map((item, index) => ({
                    ...state.datasets[index],
                    data: state.datasets[index].data
                        .slice(1)
                        .concat(typeof item === 'number' ? Number(item.toFixed(2)) : item),
                })),
            })
        );

    const clear = () =>
        setData((state) =>
            merge(state, {
                datasets: state.datasets.map((value) => ({
                    ...value,
                    data: Array(20).fill(-5),
                })),
            })
        );

    const themed = { ...data, datasets: data.datasets.map(colorize(opts?.colors || defaultPalette)) };

    return { props: { data: themed, options }, push, clear };
}

function useChartTickLabel(label: string, max: number, tickLabel: string, roundTo?: number, color?: string) {
    return useChart(label, {
        sets: 1,
        colors: color ? [color] : undefined,
        options: {
            scales: {
                y: {
                    suggestedMax: max,
                    ticks: {
                        callback(value) {
                            return `${roundTo ? Number(value).toFixed(roundTo) : value}${tickLabel}`;
                        },
                    },
                },
            },
        },
    });
}

export { useChart, useChartTickLabel, getOptions, getEmptyData };
