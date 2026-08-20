// Mirrors the dashboard's `timeOptions` (see
// dashboard/src/app/shared/utils/constants.ts): the full set of hours an
// admin can ever open up for a day. The booking page renders all of them
// and marks whichever aren't in that day's `availableTimeSlots` (never
// offered, or already booked) as disabled, instead of only rendering the
// bookable ones.
export const ALL_TIME_SLOTS = [
	"08:00",
	"09:00",
	"10:00",
	"11:00",
	"12:00",
	"13:00",
	"14:00",
	"15:00",
	"16:00",
	"17:00",
	"18:00",
	"19:00",
	"20:00"
];
