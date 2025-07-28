import { useParams, Navigate } from 'react-router-dom';
import HouseCleaningTicket from './tickets/HouseCleaningTicket';
import LawnCareTicket from './tickets/LawnCareTicket';
import SnowRemovalTicket from './tickets/SnowRemovalTicket';
import CustomTicket from './tickets/CustomTicket';

export default function TicketRoute() {
  const { template } = useParams<{ template: string }>();

  switch (template) {
    case 'house-cleaning':
      return <HouseCleaningTicket />;
    case 'lawn-care':
      return <LawnCareTicket />;
    case 'snow-removal':
      return <SnowRemovalTicket />;
    case 'custom':
      return <CustomTicket />;
    default:
      return <Navigate to="/new-ticket" replace />;
  }
}