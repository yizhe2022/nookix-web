export const GENRE_SLUG_MAP: Record<string, string> = {
  "History": "history-books",
  "Business": "business-books",
  "Leadership": "leadership-books",
  "Marketing": "marketing-books",
  "Management": "management-books",
  "Innovation": "innovation-books",
  "Economics": "economics-books",
  "Productivity": "productivity-books",
  "Psychology": "psychology-books",
  "Mindset": "mindset-books",
  "Communication": "communication-books",
  "Philosophy": "philosophy-books",
  "Biography": "biography-books",
  "Science": "science-books",
  "Technology": "technology-books",
  "Society": "society-books",
  "Health": "health-books",
  "Parenting": "parenting-books",
  "Self-Help": "self-help-books",
  "Personal Finance": "personal-finance-books",
  "Investment": "investment-books",
  "Relationship": "relationship-books",
  "Startups": "startups-books",
  "Sales": "sales-books",
  "Fitness": "fitness-books",
  "Nutrition": "nutrition-books",
  "Wellness": "wellness-books",
  "Spirituality": "spiritual-books",
  "Artificial Intelligence": "ai-books",
  "Future": "future-books",
  "Nature": "nature-books",
  "Classics": "classics-books",
  "Sci-Fiction": "science-fiction-books",
  "Fantasy": "fantasy-books",
  "Thriller": "thriller-books",
  "Mystery": "mystery-books",
  "Romance": "romance-books",
  "Literary": "literary-books",
  "Historical Fiction": "historical-fiction-books",
  "Politics": "politics-books",
  "Religion": "religion-books",
  "Crime": "top-crime-books",
  "Art": "books-about-art",
  "Creativity": "creativity-books"
};

export function getSlugForGenre(genreName: string): string {
  if (!genreName) return 'all';
  const slug = GENRE_SLUG_MAP[genreName];
  if (slug) return slug;
  return genreName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
