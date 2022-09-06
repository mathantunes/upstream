import { useRouter } from "next/router";
import { Place, OpeningHours, Days, Day } from "pages/api/places/[id]";
import useSWR from 'swr';
import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';
import { isEqual } from "lodash";
import moment from "moment";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const ViewPlace = () => {
	const router = useRouter();
	const { id } = router.query;

	const { data: place, error } = useSWR<Place>(`/api/places/${id}`, fetcher);
	return (<div style={{
		margin: '10px'
	}}>
		{error && <div>Failed to process request: {JSON.stringify(error)}</div>}
		{
			place && <>
				<Card sx={{ maxWidth: 345 }}>
					<CardActionArea>
						<CardMedia>
						</CardMedia>
						<CardContent>
							<Typography variant="h3">
								{place.name}
							</Typography>
							<Typography variant="h5" sx={{ marginBottom: '10px' }}>
								{place.address}
							</Typography>
							{
								place.openingHours &&
								<>
									{isCurrentlyOpen(place.openingHours) ? <>Open</> : <>Closed</>}
									<Typography variant="h6">Opening Hours</Typography>
									<ViewOpeningHours openingHours={place.openingHours} />
								</>
							}
						</CardContent>
					</CardActionArea>
				</Card>
			</>
		}
	</div >)
}


const showNextOpeningHours = (openingHours: OpeningHours) => {
	// Is currently closed and we show the next opening time
	// First try to find opening in the same day
	// Then try to find opening in the next day
	// Sunday -> should route back to monday.
}

const getNextClosingHour = (openingHours: OpeningHours) => {
	const range = getCurrentRange(openingHours);
	return range?.end;
}

const getCurrentRange = (openingHours: OpeningHours) => {
	const dateTime = moment(new Date(), 'HH:mm');
	const weekDay = dateTime.format('dddd');
	const day = openingHours.days[weekDay.toLowerCase() as keyof Days];

	return day.find(({ start, end }) =>
		dateTime.isSameOrAfter(moment(start, 'HH:mm')) && dateTime.isBefore(moment(end, 'HH:mm')));
}

const isCurrentlyOpen = (openingHours: OpeningHours): boolean => {
	return !!getCurrentRange(openingHours);
	// Take day of the week and time of the current user
	// Try to find the same day on the Opening Hours
	// Try to find a range that fits tthe time of the user
	// Type has to be OPEN
}

const ViewOpeningHours = ({ openingHours }: { openingHours: OpeningHours }) => {
	return <>
		{groupDays(openingHours.days).map(({ first, last, day }) => {
			const formattedDays = first === last ? first : `${first} - ${last}`;
			if (day?.every(h => h.type === 'CLOSED')) {
				return <>{formattedDays}: Closed</>
			}
			return <>
				<div>{formattedDays}:</div>
				{day?.map((d, i) => (<div key={i}>{d.start} - {d.end} ({d.type})</div>))}
			</>
		})}

		<Typography variant="body2">
			Closed on Holidays: {openingHours.closedOnHolidays ? 'Yes' : 'No'}
		</Typography>
		<Typography variant="body2">
			Open by Arrangement: {openingHours.openByArrangement ? 'Yes' : 'No'}
		</Typography>
	</>
}

const groupDays = (days: Days) => {
	const grouped: { first?: string, last?: string, day?: Day[] }[] = [];

	const keys = Object.keys(days);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const day = days[key as keyof Days];
		const previousDay = days[keys[i - 1] as keyof Days];
		const nextDay = days[keys[i + 1] as keyof Days];

		// Check previous days hours
		if (isEqual(previousDay, day)) {
			// If the next day is also equal, skip this day
			if (isEqual(day, nextDay)) {
				continue
			}
			// Remove last entry and reinsert with the new last date
			const latest = grouped.pop();
			grouped.push({ ...latest, last: key });
		} else {
			grouped.push({
				first: key,
				last: key,
				day: day
			});
		}
	}
	return grouped;
}

export default ViewPlace;
