/**
 * Sample Data Service
 * Generates sample listings, leads, testimonials, links, and other boilerplate data
 * for new users to visualize their profile page
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface SampleDataOptions {
  skipDuplicateCheck?: boolean;
  includeListings?: boolean;
  includeLeads?: boolean;
  includeTestimonials?: boolean;
  includeLinks?: boolean;
}

interface SampleDataCounts {
  existingListings: number;
  existingLeads: number;
  existingTestimonials: number;
  existingLinks: number;
  addedListings: number;
  addedLeads: number;
  addedTestimonials: number;
  addedLinks: number;
}

/**
 * Check if user already has sample data
 */
export async function checkExistingData(userId: string): Promise<{
  hasListings: boolean;
  hasLeads: boolean;
  hasTestimonials: boolean;
  hasLinks: boolean;
  counts: {
    listings: number;
    leads: number;
    testimonials: number;
    links: number;
  };
}> {
  logger.info('Checking existing data for user', { userId });

  try {
    const [listingsResult, leadsResult, testimonialsResult, linksResult] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('links').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    // Log any errors from the queries
    if (listingsResult.error) logger.error('Error checking listings', { error: listingsResult.error });
    if (leadsResult.error) logger.error('Error checking leads', { error: leadsResult.error });
    if (testimonialsResult.error) logger.error('Error checking testimonials', { error: testimonialsResult.error });
    if (linksResult.error) logger.error('Error checking links', { error: linksResult.error });

    const counts = {
      listings: listingsResult.count || 0,
      leads: leadsResult.count || 0,
      testimonials: testimonialsResult.count || 0,
      links: linksResult.count || 0,
    };

    logger.info('Existing data counts retrieved', { userId, counts });

    return {
      hasListings: counts.listings > 0,
      hasLeads: counts.leads > 0,
      hasTestimonials: counts.testimonials > 0,
      hasLinks: counts.links > 0,
      counts,
    };
  } catch (error) {
    logger.error('Error in checkExistingData', { userId, error });
    throw error;
  }
}

/**
 * Generate sample listings
 */
async function generateSampleListings(userId: string): Promise<number> {
  logger.info('Generating sample listings', { userId });

  const sampleListings = [
    {
      user_id: userId,
      address: '123 Sunset Boulevard',
      city: 'Los Angeles, CA 90001',
      price: '1250000',
      beds: 4,
      baths: 3.5,
      bedrooms: 4,
      bathrooms: 3.5,
      square_feet: 3200,
      sqft: 3200,
      lot_size_acres: 0.25,
      property_type: 'Single Family Home',
      description: 'Stunning modern home with breathtaking city views! This beautifully renovated property features an open floor plan, gourmet kitchen with premium appliances, and a luxurious master suite. The backyard oasis includes a sparkling pool and spa, perfect for entertaining.',
      status: 'active',
      is_featured: true,
      sort_order: 1,
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      ]),
    },
    {
      user_id: userId,
      address: '456 Oakwood Drive',
      city: 'San Francisco, CA 94102',
      price: '2850000',
      beds: 5,
      baths: 4,
      bedrooms: 5,
      bathrooms: 4,
      square_feet: 4500,
      sqft: 4500,
      lot_size_acres: 0.5,
      property_type: 'Single Family Home',
      description: 'Elegant Victorian masterpiece in the heart of the city! Fully restored with modern amenities while maintaining original charm. High ceilings, hardwood floors, and designer finishes throughout. Private garden and garage.',
      status: 'active',
      is_featured: true,
      sort_order: 2,
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
      ]),
    },
    {
      user_id: userId,
      address: '789 Maple Avenue',
      city: 'San Diego, CA 92101',
      price: '875000',
      beds: 3,
      baths: 2.5,
      bedrooms: 3,
      bathrooms: 2.5,
      square_feet: 2400,
      sqft: 2400,
      lot_size_acres: 0.15,
      property_type: 'Townhouse',
      description: 'Contemporary townhouse with coastal living at its finest! Walking distance to the beach, featuring an open concept design, rooftop deck with ocean views, and attached two-car garage. Move-in ready!',
      status: 'pending',
      is_featured: false,
      sort_order: 3,
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      ]),
    },
    {
      user_id: userId,
      address: '321 Palm Street',
      city: 'Santa Monica, CA 90401',
      price: '1450000',
      beds: 3,
      baths: 2,
      bedrooms: 3,
      bathrooms: 2,
      square_feet: 2100,
      sqft: 2100,
      property_type: 'Condo',
      description: 'Sold in record time! Luxury beachfront condo with panoramic ocean views. Recently updated with top-of-the-line finishes, this unit offered the perfect blend of comfort and coastal elegance.',
      status: 'sold',
      sold_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      is_featured: false,
      sort_order: 4,
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
        'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800',
      ]),
    },
  ];

  try {
    const { data, error } = await supabase.from('listings').insert(sampleListings).select();

    if (error) {
      logger.error('Error creating sample listings', { userId, error });
      throw error;
    }

    logger.info('Sample listings created', { userId, count: data?.length || 0 });
    return data?.length || 0;
  } catch (error) {
    logger.error('Exception in generateSampleListings', { userId, error });
    throw error;
  }
}

/**
 * Generate sample leads
 */
async function generateSampleLeads(userId: string): Promise<number> {
  logger.info('Generating sample leads', { userId });
  const sampleLeads = [
    {
      user_id: userId,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '(555) 123-4567',
      message: 'Hi! I\'m interested in learning more about properties in the area. I\'m a first-time home buyer looking for a 3-bedroom home under $800k. Would love to discuss options!',
      lead_type: 'buyer',
      price_range: '$600,000 - $800,000',
      timeline: '3-6 months',
      preapproved: true,
      status: 'new',
      utm_source: 'instagram',
    },
    {
      user_id: userId,
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      phone: '(555) 234-5678',
      message: 'I\'m thinking about selling my home and would like to get a market valuation. The property is a 4-bedroom single-family home in excellent condition.',
      lead_type: 'seller',
      property_address: '123 Elm Street, Los Angeles, CA',
      timeline: '1-3 months',
      status: 'contacted',
      contacted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      utm_source: 'google',
    },
    {
      user_id: userId,
      name: 'Emily Rodriguez',
      email: 'emily.r@example.com',
      phone: '(555) 345-6789',
      message: 'Can you provide a free home valuation for my property at 456 Oak Ave? Looking to understand current market value.',
      lead_type: 'valuation',
      property_address: '456 Oak Avenue, San Diego, CA',
      status: 'qualified',
      utm_source: 'facebook',
    },
    {
      user_id: userId,
      name: 'David Kim',
      email: 'david.kim@example.com',
      phone: '(555) 456-7890',
      message: 'I saw your listing for the property on Sunset Boulevard. Is it still available? I\'d love to schedule a viewing this week if possible.',
      lead_type: 'buyer',
      price_range: '$1,000,000 - $1,500,000',
      timeline: 'Ready now',
      preapproved: true,
      status: 'qualified',
      contacted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      utm_source: 'website',
    },
    {
      user_id: userId,
      name: 'Jennifer Martinez',
      email: 'jennifer.m@example.com',
      phone: '(555) 567-8901',
      message: 'Just wanted to say thank you for all your help! The closing went smoothly and we love our new home.',
      lead_type: 'contact',
      status: 'closed',
      contacted_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      closed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  try {
    const { data, error } = await supabase.from('leads').insert(sampleLeads).select();

    if (error) {
      logger.error('Error creating sample leads', { userId, error });
      throw error;
    }

    logger.info('Sample leads created', { userId, count: data?.length || 0 });
    return data?.length || 0;
  } catch (error) {
    logger.error('Exception in generateSampleLeads', { userId, error });
    throw error;
  }
}

/**
 * Generate sample testimonials
 */
async function generateSampleTestimonials(userId: string): Promise<number> {
  logger.info('Generating sample testimonials', { userId });
  const sampleTestimonials = [
    {
      user_id: userId,
      client_name: 'Robert & Lisa Thompson',
      rating: 5,
      review: 'Working with this agent was an absolute pleasure! They guided us through every step of buying our first home with patience and expertise. Their knowledge of the market and negotiation skills helped us get our dream home at a great price. Highly recommend!',
      transaction_type: 'buyer',
      property_type: 'Single Family Home',
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_featured: true,
      is_published: true,
      sort_order: 1,
    },
    {
      user_id: userId,
      client_name: 'Amanda Foster',
      rating: 5,
      review: 'Best real estate agent I\'ve ever worked with! Sold my home in just 3 days for over asking price. The marketing was top-notch and the communication was excellent throughout the entire process. Will definitely use again for my next transaction!',
      transaction_type: 'seller',
      property_type: 'Condo',
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_featured: true,
      is_published: true,
      sort_order: 2,
    },
    {
      user_id: userId,
      client_name: 'James Wilson',
      rating: 5,
      review: 'Outstanding service from start to finish. Very knowledgeable about the local market and always available to answer questions. Made the selling process stress-free and got us a great deal. Thank you!',
      transaction_type: 'seller',
      property_type: 'Townhouse',
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_featured: false,
      is_published: true,
      sort_order: 3,
    },
    {
      user_id: userId,
      client_name: 'Maria & Carlos Garcia',
      rating: 5,
      review: 'We can\'t thank our agent enough for helping us find the perfect family home! They listened to our needs, showed us great properties, and were always professional. Their expertise made all the difference. Highly recommended!',
      transaction_type: 'buyer',
      property_type: 'Single Family Home',
      date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_featured: false,
      is_published: true,
      sort_order: 4,
    },
  ];

  try {
    const { data, error } = await supabase.from('testimonials').insert(sampleTestimonials).select();

    if (error) {
      logger.error('Error creating sample testimonials', { userId, error });
      throw error;
    }

    logger.info('Sample testimonials created', { userId, count: data?.length || 0 });
    return data?.length || 0;
  } catch (error) {
    logger.error('Exception in generateSampleTestimonials', { userId, error });
    throw error;
  }
}

/**
 * Generate sample custom links
 */
async function generateSampleLinks(userId: string): Promise<number> {
  logger.info('Generating sample links', { userId });
  const sampleLinks = [
    {
      user_id: userId,
      title: 'Schedule a Consultation',
      url: 'https://calendly.com/your-name',
      icon: 'calendar',
      position: 1,
      is_active: true,
      click_count: 0,
    },
    {
      user_id: userId,
      title: 'Free Home Valuation',
      url: '/leads?type=valuation',
      icon: 'home',
      position: 2,
      is_active: true,
      click_count: 0,
    },
    {
      user_id: userId,
      title: 'Browse All Listings',
      url: '/listings',
      icon: 'search',
      position: 3,
      is_active: true,
      click_count: 0,
    },
    {
      user_id: userId,
      title: 'Buyer Resources',
      url: 'https://your-website.com/buyers',
      icon: 'book-open',
      position: 4,
      is_active: true,
      click_count: 0,
    },
    {
      user_id: userId,
      title: 'Seller Guide',
      url: 'https://your-website.com/sellers',
      icon: 'file-text',
      position: 5,
      is_active: true,
      click_count: 0,
    },
    {
      user_id: userId,
      title: 'Contact Me',
      url: '/contact',
      icon: 'mail',
      position: 6,
      is_active: true,
      click_count: 0,
    },
  ];

  try {
    const { data, error } = await supabase.from('links').insert(sampleLinks).select();

    if (error) {
      logger.error('Error creating sample links', { userId, error });
      throw error;
    }

    logger.info('Sample links created', { userId, count: data?.length || 0 });
    return data?.length || 0;
  } catch (error) {
    logger.error('Exception in generateSampleLinks', { userId, error });
    throw error;
  }
}

/**
 * Generate all sample data for a user
 */
export async function generateSampleData(
  userId: string,
  options: SampleDataOptions = {}
): Promise<SampleDataCounts> {
  logger.info('Starting generateSampleData', { userId, options });

  const {
    skipDuplicateCheck = false,
    includeListings = true,
    includeLeads = true,
    includeTestimonials = true,
    includeLinks = true,
  } = options;

  const counts: SampleDataCounts = {
    existingListings: 0,
    existingLeads: 0,
    existingTestimonials: 0,
    existingLinks: 0,
    addedListings: 0,
    addedLeads: 0,
    addedTestimonials: 0,
    addedLinks: 0,
  };

  try {
    // Check for existing data unless skip is specified
    if (!skipDuplicateCheck) {
      const existingData = await checkExistingData(userId);
      counts.existingListings = existingData.counts.listings;
      counts.existingLeads = existingData.counts.leads;
      counts.existingTestimonials = existingData.counts.testimonials;
      counts.existingLinks = existingData.counts.links;

      // Skip categories that already have data
      if (existingData.hasListings && includeListings) {
        logger.info('User already has listings, skipping');
      }
      if (existingData.hasLeads && includeLeads) {
        logger.info('User already has leads, skipping');
      }
      if (existingData.hasTestimonials && includeTestimonials) {
        logger.info('User already has testimonials, skipping');
      }
      if (existingData.hasLinks && includeLinks) {
        logger.info('User already has links, skipping');
      }

      // Generate sample data only for categories without existing data
      if (!existingData.hasListings && includeListings) {
        counts.addedListings = await generateSampleListings(userId);
      }
      if (!existingData.hasLeads && includeLeads) {
        counts.addedLeads = await generateSampleLeads(userId);
      }
      if (!existingData.hasTestimonials && includeTestimonials) {
        counts.addedTestimonials = await generateSampleTestimonials(userId);
      }
      if (!existingData.hasLinks && includeLinks) {
        counts.addedLinks = await generateSampleLinks(userId);
      }
    } else {
      logger.info('Skipping duplicate check, generating all requested data');
      
      // Skip duplicate check - generate all requested data
      if (includeListings) {
        counts.addedListings = await generateSampleListings(userId);
      }
      if (includeLeads) {
        counts.addedLeads = await generateSampleLeads(userId);
      }
      if (includeTestimonials) {
        counts.addedTestimonials = await generateSampleTestimonials(userId);
      }
      if (includeLinks) {
        counts.addedLinks = await generateSampleLinks(userId);
      }
    }

    logger.info('Sample data generation completed', { userId, counts });
    return counts;
  } catch (error) {
    logger.error('Error in generateSampleData', { userId, error });
    throw error;
  }
}

/**
 * Delete all sample data for a user (useful for testing or cleanup)
 */
export async function deleteSampleData(userId: string): Promise<void> {
  await Promise.all([
    supabase.from('listings').delete().eq('user_id', userId),
    supabase.from('leads').delete().eq('user_id', userId),
    supabase.from('testimonials').delete().eq('user_id', userId),
    supabase.from('links').delete().eq('user_id', userId),
  ]);
}
