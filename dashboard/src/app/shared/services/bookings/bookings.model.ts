export interface BookingDto {
	id?: string;
	name: string;
	lastName: string;
	email: string;
	phone: string;
	notes?: string;
	date: string;
	time: string;
	isAccepted: boolean;
}
