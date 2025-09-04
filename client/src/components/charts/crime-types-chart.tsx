import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CrimeTypesChartProps {
  data: { type: string; count: number }[];
}

export function CrimeTypesChart({ data }: CrimeTypesChartProps) {
  const chartData = {
    labels: data.map(item => item.type.charAt(0).toUpperCase() + item.type.slice(1)),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: [
          "hsl(221, 83%, 53%)",
          "hsl(142, 71%, 45%)",
          "hsl(48, 96%, 53%)",
          "hsl(0, 85%, 60%)",
          "hsl(262, 83%, 58%)",
        ],
        borderWidth: 2,
        borderColor: "var(--background)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className="h-64" data-testid="chart-crime-types">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
