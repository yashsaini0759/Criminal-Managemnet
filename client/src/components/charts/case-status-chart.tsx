import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CaseStatusChartProps {
  data: { status: string; count: number }[];
}

export function CaseStatusChart({ data }: CaseStatusChartProps) {
  const chartData = {
    labels: data.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1)),
    datasets: [
      {
        label: "Cases",
        data: data.map(item => item.count),
        backgroundColor: "hsl(221, 83%, 53%)",
        borderColor: "hsl(221, 83%, 53%)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-64" data-testid="chart-case-status">
      <Bar data={chartData} options={options} />
    </div>
  );
}
