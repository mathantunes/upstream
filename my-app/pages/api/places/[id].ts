import type { NextApiRequest, NextApiResponse } from 'next'

export type Error = {
	message: string;
}

export type Place = {
	name: string;
	address: string;
	openingHours?: OpeningHours;
}

export type OpeningHours = {
	days: Days;
	closedOnHolidays: boolean;
	openByArrangement: boolean;
}

export type Days = {
	monday: Day[];
	tuesday: Day[];
	wednesday: Day[];
	thursday: Day[];
	friday: Day[];
	saturday: Day[];
	sunday: Day[];
}

export type Day = {
	start: string;
	end: string;
	type: string;
}

const getUrl = (id: string) => `https://storage.googleapis.com/coding-session-rest-api/${id}`;

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Place | Error>
) {
	const { id } = req.query;
	if (!id) return res.status(400).json({ message: 'Please provide an id' });

	const response = await fetch(getUrl(id as string));
	const obj = await response.json();
	res.status(200).json(convertToPlace(obj));
}

const convertToPlace = (obj: any): Place => {
	return {
		name: obj.displayed_what,
		address: obj.displayed_where,
		openingHours: obj.opening_hours ? {
			closedOnHolidays: obj.opening_hours.closed_on_holidays,
			openByArrangement: obj.opening_hours.open_by_arrangement,
			days: obj.opening_hours.days
		} : undefined
	}
}

