import React from 'react';
import {Tr, Td, IconButton, Text, Skeleton} from '@chakra-ui/react';
import {InfoIcon} from '@chakra-ui/icons';

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

export default SkeletonRow;