import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Table, Thead, Tbody, Tr, Th, Td, Select, IconButton, Spacer, HStack, VStack, TableCaption, Text, useDisclosure, useBreakpointValue, Box, Heading, Button, Skeleton} from '@chakra-ui/react';
import {ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, InfoIcon, InfoOutlineIcon} from '@chakra-ui/icons';
import {observer} from 'mobx-react-lite';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import useAPI from '../lib/api-state-context';
import usePrevious from '../lib/use-previous';
import useBackgroundColor from '../lib/use-background-color';
import styles from './styles/table.module.scss';
import InlineStat from './inline-stat';
import SectionsTable from './sections-table';
import CourseStats from './course-stats';
import ConditionalWrapper from './conditional-wrapper';
import {ICourseFromAPI, ISectionFromAPI} from '../lib/types';
import getCreditsStr from '../lib/get-credits-str';
import useCurrentDate from '../lib/use-current-date';

dayjs.extend(relativeTime);

const TableRow = observer(({isHighlighted = false, isSectionHighlighted = false, course, sections}: {isHighlighted: boolean; isSectionHighlighted: boolean; course: ICourseFromAPI; sections: ISectionFromAPI[]}) => {
	const backgroundColor = useBackgroundColor();
	const {isOpen, onToggle} = useDisclosure();
	const wasOpen = usePrevious(isOpen);
	const [onlyShowSections, setOnlyShowSections] = useState(isSectionHighlighted);
	const store = useAPI();

	useEffect(() => {
		if (isSectionHighlighted && !wasOpen && !isOpen) {
			onToggle();
			setOnlyShowSections(true);
		}
	}, [isSectionHighlighted, wasOpen, onToggle, isOpen]);

	const creditsString: string = useMemo(() => {
		if (sections.length === 0) {
			return '';
		}

		let min = 10000;
		let max = 0;
		sections.forEach(s => {
			if (s.minCredits < min) {
				min = s.minCredits;
			}

			if (s.maxCredits > max) {
				max = s.maxCredits;
			}
		});

		return getCreditsStr(min, max);
	}, [sections]);

	const courseKey = `${course.subject}${course.crse}`;

	return (
		<>
			<Tr className={isOpen ? styles.hideBottomBorder : ''}>
				<Td>{course.subject}<b>{course.crse}</b></Td>
				<Td whiteSpace="nowrap">
					{isHighlighted ? (
						<mark>{course.title}</mark>
					) : (
						course.title
					)}
				</Td>
				<Td isNumeric>{creditsString}</Td>
				<Td display={{base: 'none', md: 'table-cell'}}><Text noOfLines={1} as="span">{course.description}</Text></Td>
				<Td style={{textAlign: 'right'}}>
					<IconButton
						variant="ghost"
						colorScheme="blue"
						onClick={onToggle}
						aria-label={isOpen ? 'Hide course details' : 'Show course details'}
						isActive={isOpen}
						data-testid="course-details-button"
						isDisabled={isSectionHighlighted}>
						{isOpen ? <InfoIcon/> : <InfoOutlineIcon/>}
					</IconButton>
				</Td>
			</Tr>

			{isOpen && (
				<Tr>
					<Td colSpan={5}>
						<ConditionalWrapper
							condition={onlyShowSections}
							wrapper={children => (
								<Button w="100%" h="100%" p={4} onClick={() => {
									setOnlyShowSections(false);
								}} aria-label="Show full course details">
									{children}
								</Button>
							)}>
							<VStack align="flex-start" spacing={10} w="100%">
								{
									onlyShowSections && (
										<Text fontSize="2xl" fontWeight="bold" w="100%">.	.	.</Text>
									)
								}

								{
									!onlyShowSections && (
										<>
											<Text>
												<b>Description: </b>
												{course.description}
											</Text>

											{
												store.passfaildrop[courseKey] && (
													<Box w="100%">
														<Heading mb={4}>Stats</Heading>

														<CourseStats w="100%" shadow="base" rounded="md" p={4} data={store.passfaildrop[courseKey]}/>
													</Box>
												)
											}
										</>
									)
								}

								<Box w="100%">
									{!onlyShowSections && (
										<Heading mb={4}>Sections</Heading>
									)}

									<SectionsTable shadow="base" borderRadius="md" isHighlighted={isSectionHighlighted} bgColor={backgroundColor} sections={sections}/>
								</Box>
							</VStack>
						</ConditionalWrapper>
					</Td>
				</Tr>
			)}
		</>
	);
});

const SkeletonRow = () => (
	<Tr>
		<Td>
			<Skeleton>
				CS1000
			</Skeleton>
		</Td>
		<Td whiteSpace="nowrap">
			<Skeleton>
				Introduction to Programming I
			</Skeleton>
		</Td>
		<Td isNumeric><Skeleton>3</Skeleton></Td>
		<Td display={{base: 'none', md: 'table-cell'}}>
			<Skeleton w="100%">
				<Text noOfLines={1} as="span">
					An introduction to programming with Java.
					An introduction to programming with Java.
					An introduction to programming with Java.
					An introduction to programming with Java.
					An introduction to programming with Java.
				</Text>
			</Skeleton>
		</Td>
		<Td style={{textAlign: 'right'}}>
			<Skeleton>
				<IconButton
					variant="ghost"
					colorScheme="blue"
					aria-label="Loading..."
					data-testid="course-details-button">
					<InfoIcon/>
				</IconButton>
			</Skeleton>
		</Td>
	</Tr>
);

const TableBody = observer(({courses}: {courses: ICourseFromAPI[]}) => {
	const store = useAPI();

	return (
		<Tbody>
			{
				store.hasCourseData ?
					courses.map(course => <TableRow key={course.id} course={course} isHighlighted={false} isSectionHighlighted={false} sections={store.sectionsByCourseId.get(course.id) ?? []}/>)				:
					Array.from(new Array(10).keys()).map(i => (
						<SkeletonRow key={i}/>
					))
			}
		</Tbody>
	);
});

const TABLE_LENGTH_OPTIONS = [10, 20, 50];

const DataTable = ({isHighlighted = false}: {isHighlighted: boolean}) => {
	const tableSize = useBreakpointValue({base: 'sm', md: 'md'});
	const store = useAPI();
	const now = useCurrentDate(1000 * 60);

	const [page, setPage] = useState(0);
	const [pageSize, setPageSize] = useState(10);

	const lastUpdatedString = useMemo(() => dayjs(store.dataLastUpdatedAt).from(now), [store.dataLastUpdatedAt, now]);
	const totalCoursesString = store.courses.length.toLocaleString();

	const numberOfPages = Math.ceil(store.courses.length / pageSize);

	const handlePageSizeChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
		setPageSize(Number.parseInt(event.target.value, 10));
	}, []);

	const pagedData = useMemo(() => store.sortedCourses.slice(page * pageSize, (page + 1) * pageSize), [store.sortedCourses, page, pageSize]);

	return (
		<VStack maxW="min(100rem, 80%)">
			<HStack w="100%" mb={2}>
				<Skeleton isLoaded={store.hasCourseData}>
					<InlineStat label="matched" number={totalCoursesString} help={`out of ${totalCoursesString} courses`}/>
				</Skeleton>

				<Spacer/>

				<Skeleton isLoaded={store.hasCourseData}>
					<Text>data last updated {lastUpdatedString}</Text>
				</Skeleton>
			</HStack>

			<Table variant="simple" boxShadow="base" borderRadius="md" size={tableSize}>
				<TableCaption p="0" mb={4}>

					<HStack w="100%">
						<IconButton
							aria-label="Go to begining"
							size="sm"
							isDisabled={page === 0 || !store.hasCourseData}
							onClick={() => {
								setPage(0);
							}}
						>
							<ArrowLeftIcon/>
						</IconButton>

						<IconButton
							aria-label="Move back a page"
							size="sm"
							isDisabled={page === 0 || !store.hasCourseData}
							onClick={() => {
								setPage(p => p - 1);
							}}
						>
							<ChevronLeftIcon/>
						</IconButton>

						<Spacer/>

						<HStack>
							<Skeleton isLoaded={store.hasCourseData}>
								<Text>page {page + 1} of {numberOfPages}</Text>
							</Skeleton>

							<Select
								w="auto"
								size="sm"
								aria-label="Change number of rows per page"
								selected={pageSize}
								onChange={handlePageSizeChange}
								disabled={!store.hasCourseData}
							>
								{TABLE_LENGTH_OPTIONS.map(o => (
									<option value={o} key={o}>{o}</option>
								))}
							</Select>
						</HStack>

						<Spacer/>

						<IconButton
							aria-label="Move forward a page"
							size="sm"
							isDisabled={page === numberOfPages - 1 || !store.hasCourseData}
							onClick={() => {
								setPage(p => p + 1);
							}}
						>
							<ChevronRightIcon/>
						</IconButton>

						<IconButton
							aria-label="Go to end"
							size="sm"
							isDisabled={page === numberOfPages - 1 || !store.hasCourseData}
							onClick={() => {
								setPage(numberOfPages - 1);
							}}
						>
							<ArrowRightIcon/>
						</IconButton>
					</HStack>
				</TableCaption>
				<Thead>
					<Tr>
						<Th>Course</Th>
						<Th>Title</Th>
						<Th isNumeric>Credits</Th>
						<Th display={{base: 'none', md: 'table-cell'}}>Description</Th>
						<Th style={{textAlign: 'right'}}>Details</Th>
					</Tr>
				</Thead>
				<TableBody courses={pagedData}/>
			</Table>
		</VStack>
	);
};

export default observer(DataTable);
