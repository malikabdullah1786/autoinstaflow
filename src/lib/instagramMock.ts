// Mock Instagram content database and simulator helper

export interface MockIgItem {
  id: string;
  type: 'post' | 'reel' | 'story';
  caption: string;
  url: string;
  thumbnail: string;
  likes: number;
  commentsCount: number;
  publishedAt: string; // ISO string
  active?: boolean; // For stories
  commentsList: { id: string; username: string; text: string; timestamp: string }[];
}

export const MOCK_IG_ITEMS: MockIgItem[] = [
  {
    id: 'post_101',
    type: 'post',
    caption: '🚀 Ready to automate your DM pipeline? Drop a comment with the keyword LINK to get our free automation setup guide instantly! #marketing #saas',
    url: 'https://instagram.com/p/C8_post101',
    thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=400&fit=crop',
    likes: 342,
    commentsCount: 9,
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    commentsList: [
      { id: 'c_1', username: 'jessica_dev', text: 'Send me the link!', timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
      { id: 'c_2', username: 'alex_marketing', text: 'LINK please', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      { id: 'c_3', username: 'tom_growth', text: 'Great tip! Will check it out.', timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
      { id: 'c_4', username: 'lucy_sells', text: 'I need that link, thank you', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
      { id: 'c_5', username: 'marcus_seo', text: 'Can I get the info?', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
      { id: 'c_6', username: 'sarah_styles', text: 'link please!', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
      { id: 'c_7', username: 'brian_fit', text: 'Love the graphic! drop the LINK', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() }
    ]
  },
  {
    id: 'reel_202',
    type: 'reel',
    caption: 'How we generated $12,000 in sales using simple follow gating. Comment INFO below to see the exact product map we used!',
    url: 'https://instagram.com/reel/C8_reel202',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
    likes: 1250,
    commentsCount: 6,
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    commentsList: [
      { id: 'c_11', username: 'karen_social', text: 'Show me the info', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
      { id: 'c_12', username: 'damon_ecom', text: 'INFO', timestamp: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString() },
      { id: 'c_13', username: 'clara_writes', text: 'This is super interesting!', timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
      { id: 'c_14', username: 'tony_dropship', text: 'Need the info map ASAP', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
    ]
  },
  {
    id: 'post_103',
    type: 'post',
    caption: 'Standard lifestyle update. Coffee, laptop, and some automation coding. Comment COFFEE to see my favorite spots in Lisbon!',
    url: 'https://instagram.com/p/C8_post103',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
    likes: 180,
    commentsCount: 3,
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago (older than 7 days)
    commentsList: [
      { id: 'c_21', username: 'nomad_nic', text: 'Lisbon is amazing!', timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
      { id: 'c_22', username: 'coffee_snob', text: 'COFFEE code', timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'post_104',
    type: 'post',
    caption: 'Announcing our private beta waitlist! Comment JOIN to get early access before everyone else.',
    url: 'https://instagram.com/p/C8_post104',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop',
    likes: 95,
    commentsCount: 0,
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    commentsList: []
  },
  {
    id: 'story_301',
    type: 'story',
    caption: 'Story poll: do you use automated DMs?',
    url: 'https://instagram.com/stories/C8_story301',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    likes: 0,
    commentsCount: 0,
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago (active!)
    active: true,
    commentsList: []
  },
  {
    id: 'story_302',
    type: 'story',
    caption: 'Q&A: Ask me anything about Instagram Gating!',
    url: 'https://instagram.com/stories/C8_story302',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
    likes: 0,
    commentsCount: 0,
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago (active!)
    active: true,
    commentsList: []
  }
];
