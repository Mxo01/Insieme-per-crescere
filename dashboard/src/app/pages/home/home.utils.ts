import { BookingDto } from "src/app/shared/services/bookings/bookings.model";

// Pulled out of Home so the component stays focused on wiring signals to
// the template — the actual "grouping/deriving" logic behind the chart and
// the agenda lives here instead.

export const MONTH_LABELS_IT = [
	"Gen",
	"Feb",
	"Mar",
	"Apr",
	"Mag",
	"Giu",
	"Lug",
	"Ago",
	"Set",
	"Ott",
	"Nov",
	"Dic"
];

export interface MonthlyBookingCount {
	year: number;
	month: number;
	label: string;
	count: number;
}

// "Prenotazioni nel tempo": bookings grouped into the last 12 calendar
// months (oldest → newest, current month last).
export function getMonthlyBookingCounts(
	bookings: BookingDto[],
	now = new Date()
): MonthlyBookingCount[] {
	const months = Array.from({ length: 12 }, (_, i) => {
		const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
		return {
			year: d.getFullYear(),
			month: d.getMonth(),
			label: MONTH_LABELS_IT[d.getMonth()],
			count: 0
		};
	});

	for (const booking of bookings) {
		const [day, month, year] = booking.date.split("/").map(Number);
		if (!day || !month || !year) continue;

		const entry = months.find(m => m.year === year && m.month === month - 1);
		if (entry) entry.count++;
	}

	return months;
}

export function getBookingsChartData(months: MonthlyBookingCount[]) {
	const lastIndex = months.length - 1;

	return {
		labels: months.map(m => m.label),
		datasets: [
			{
				label: "Prenotazioni",
				data: months.map(m => m.count),
				backgroundColor: months.map((_, i) => (i === lastIndex ? "#5D2B9E" : "#EADFF9")),
				borderRadius: 10,
				maxBarThickness: 34
			}
		]
	};
}

export const bookingsChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: { legend: { display: false } },
	scales: {
		x: {
			grid: { display: false },
			ticks: { color: "#8A7C96", font: { weight: 700, size: 12 } }
		},
		y: {
			beginAtZero: true,
			ticks: { precision: 0, color: "#8A7C96" },
			grid: { color: "rgba(36,22,52,0.06)" }
		}
	}
};

// "Prossimi appuntamenti": accepted bookings from today onward, soonest
// first.
export function getUpcomingConfirmedBookings(
	bookings: BookingDto[],
	today = new Date()
): BookingDto[] {
	const startOfToday = new Date(today);
	startOfToday.setHours(0, 0, 0, 0);

	return bookings
		.filter(b => b.isAccepted)
		.map(b => {
			const [day, month, year] = b.date.split("/").map(Number);
			return { booking: b, dateValue: new Date(year, month - 1, day) };
		})
		.filter(({ dateValue }) => dateValue >= startOfToday)
		.sort(
			(a, b) =>
				a.dateValue.getTime() - b.dateValue.getTime() ||
				a.booking.time.localeCompare(b.booking.time)
		)
		.map(({ booking }) => booking);
}
