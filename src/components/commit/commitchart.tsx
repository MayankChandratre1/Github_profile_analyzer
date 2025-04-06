interface CommitData {
  date: string;
  count: number;
}

interface CommitChartProps {
  data: CommitData[];
}

const CommitChart = ({ data }: CommitChartProps) => {
  const getColor = (count: number) => {
    if (count === 0) return '#ebedf0';
    if (count <= 5) return '#818cf8'; // lighter indigo
    if (count <= 7) return '#6366f1'; // indigo
    return '#7c3aed'; // purple
  };

  return (
    <div className="w-full p-4">
      <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-30 gap-1">
        {data.map((day, index) => (
          <div
            key={index}
            className="w-full pb-[100%] relative group"
            title={`${day.count} commits on ${day.date}`}
          >
            <div
              className="absolute inset-0 rounded transition-all duration-200 hover:scale-110 hover:shadow-lg"
              style={{ backgroundColor: getColor(day.count) }}
            />
            <div className="absolute opacity-0 group-hover:opacity-100 bg-black/75 inset-0 rounded flex items-center justify-center text-white text-xs transition-opacity duration-200">
              {day.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommitChart;