export const RECOMMENDED_FACTORIES = [
  { id: '1', name: 'Precision Metalworks Co.', type: 'Metal Stamping', rating: 4.8, leadTime: '2-3 weeks', location: 'Bangkok' },
  { id: '2', name: 'EcoPlastics Assembly', type: 'Injection Molding', rating: 4.6, leadTime: '3-4 weeks', location: 'Chonburi' },
  { id: '3', name: 'FastCNC Pro', type: 'CNC Machining', rating: 4.9, leadTime: '1-2 weeks', location: 'Rayong' },
];

export const RECENT_ACTIVITY = [
  { id: '1', title: 'Aluminum Enclosures', type: 'RFQ Sent', status: 'Awaiting Quotes', time: '2 hours ago', color: 'bg-blue-100 text-blue-700' },
  { id: '2', title: 'Custom Plastic Gears', type: 'Order Placed', status: 'In Production', time: '1 day ago', color: 'bg-green-100 text-green-700' },
  { id: '3', title: 'Silicone Gaskets', type: 'RFQ Draft', status: 'Incomplete', time: '3 days ago', color: 'bg-gray-100 text-gray-700' },
];

export const ACTIVE_RFQS = [
  { id: 'rfq-1', title: 'Custom Aluminum Heatsinks', category: 'CNC Machining', date: '2023-10-24', status: 'Active', offers: 3 },
  { id: 'rfq-2', title: 'Polycarbonate Casings', category: 'Injection Molding', date: '2023-10-25', status: 'Active', offers: 5 },
];

export const RFQ_HISTORY = [
  { id: 'rfq-3', title: 'Steel Brackets', category: 'Metal Fabrication', date: '2023-09-15', status: 'Closed', offers: 2 },
];

export const RFQ_OFFERS = [
  {
    id: 'off-1',
    factoryName: 'Precision Metalworks Co.',
    price: '$4,500',
    leadTime: '14 Days',
    rating: 4.8,
    isRecommended: true,
    recommendationReason: 'Best overall value & fastest lead time',
    badges: ['Fastest', 'Top Rated']
  },
  {
    id: 'off-2',
    factoryName: 'Global Manufacturing Ltd.',
    price: '$4,100',
    leadTime: '21 Days',
    rating: 4.5,
    isRecommended: false,
    badges: ['Lowest Price']
  },
  {
    id: 'off-3',
    factoryName: 'Local Machining Experts',
    price: '$5,200',
    leadTime: '10 Days',
    rating: 4.9,
    isRecommended: false,
    badges: ['Premium Quality']
  }
];

export const ORDER_TIMELINE = [
  { id: 't1', title: 'Order Confirmed', date: 'Oct 20, 10:00 AM', status: 'completed', image: null },
  { id: 't2', title: 'Material Procured', date: 'Oct 22, 14:30 PM', status: 'completed', image: null },
  { id: 't3', title: 'Initial QC Passed', date: 'Oct 25, 09:15 AM', status: 'completed', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=200&fit=crop' },
  { id: 't4', title: 'Final Assembly', date: 'Expected Oct 28', status: 'current', image: null },
  { id: 't5', title: 'Ready to Ship', date: 'Pending', status: 'upcoming', image: null },
];
