import { APIResponse } from '$/types/api';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { chat } from '$/utils/llm';
import { ANILIST_API, Collections } from '$/constants';
import { findClosestOf } from '$/utils/strings';
import { extractUserId } from '$/utils/auth';
import { getDatabase } from '$/middleware/mongo';
import { User } from '$/types/schema';

const searchRouter = express.Router();

type SearchResult = {
  key: string;
  type: string;
  value: string | number | boolean | null;
};

const searchPayloadSchema = z.object({
  query: z.string().min(1),
});

const genres = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
  '4-koma',
  'Achromatic',
  'Achronological Order',
  'Acrobatics',
  'Acting',
  'Adoption',
  'Advertisement',
  'Afterlife',
  'Age Gap',
  'Age Regression',
  'Agender',
  'Agriculture',
  'Airsoft',
  'Alchemy',
  'Aliens',
  'Alternate Universe',
  'American Football',
  'Amnesia',
  'Anachronism',
  'Ancient China',
  'Angels',
  'Animals',
  'Anthology',
  'Anthropomorphism',
  'Anti-Hero',
  'Archery',
  'Aromantic',
  'Arranged Marriage',
  'Artificial Intelligence',
  'Asexual',
  'Assassins',
  'Astronomy',
  'Athletics',
  'Augmented Reality',
  'Autobiographical',
  'Aviation',
  'Badminton',
  'Band',
  'Bar',
  'Baseball',
  'Basketball',
  'Battle Royale',
  'Biographical',
  'Bisexual',
  'Blackmail',
  'Board Game',
  'Boarding School',
  'Body Horror',
  'Body Image',
  'Body Swapping',
  'Bowling',
  'Boxing',
  "Boys' Love",
  'Bullying',
  'Butler',
  'Calligraphy',
  'Camping',
  'Cannibalism',
  'Card Battle',
  'Cars',
  'Centaur',
  'CGI',
  'Cheerleading',
  'Chibi',
  'Chimera',
  'Chuunibyou',
  'Circus',
  'Class Struggle',
  'Classic Literature',
  'Classical Music',
  'Clone',
  'Coastal',
  'Cohabitation',
  'College',
  'Coming of Age',
  'Conspiracy',
  'Cosmic Horror',
  'Cosplay',
  'Cowboys',
  'Creature Taming',
  'Crime',
  'Criminal Organization',
  'Crossdressing',
  'Crossover',
  'Cult',
  'Cultivation',
  'Curses',
  'Cute Boys Doing Cute Things',
  'Cute Girls Doing Cute Things',
  'Cyberpunk',
  'Cyborg',
  'Cycling',
  'Dancing',
  'Death Game',
  'Delinquents',
  'Demons',
  'Denpa',
  'Desert',
  'Detective',
  'Dinosaurs',
  'Disability',
  'Dissociative Identities',
  'Dragons',
  'Drawing',
  'Drugs',
  'Dullahan',
  'Dungeon',
  'Dystopian',
  'E-Sports',
  'Eco-Horror',
  'Economics',
  'Educational',
  'Elderly Protagonist',
  'Elf',
  'Ensemble Cast',
  'Environmental',
  'Episodic',
  'Ero Guro',
  'Espionage',
  'Estranged Family',
  'Exorcism',
  'Fairy',
  'Fairy Tale',
  'Fake Relationship',
  'Family Life',
  'Fashion',
  'Female Harem',
  'Female Protagonist',
  'Femboy',
  'Fencing',
  'Filmmaking',
  'Firefighters',
  'Fishing',
  'Fitness',
  'Flash',
  'Food',
  'Football',
  'Foreign',
  'Found Family',
  'Fugitive',
  'Full CGI',
  'Full Color',
  'Gambling',
  'Gangs',
  'Gender Bending',
  'Ghost',
  'Go',
  'Goblin',
  'Gods',
  'Golf',
  'Gore',
  'Guns',
  'Gyaru',
  'Handball',
  'Henshin',
  'Heterosexual',
  'Hikikomori',
  'Hip-hop Music',
  'Historical',
  'Homeless',
  'Horticulture',
  'Ice Skating',
  'Idol',
  'Indigenous Cultures',
  'Inn',
  'Isekai',
  'Iyashikei',
  'Jazz Music',
  'Josei',
  'Judo',
  'Kaiju',
  'Karuta',
  'Kemonomimi',
  'Kids',
  'Kingdom Management',
  'Konbini',
  'Kuudere',
  'Lacrosse',
  'Language Barrier',
  'LGBTQ+ Themes',
  'Long Strip',
  'Lost Civilization',
  'Love Triangle',
  'Mafia',
  'Magic',
  'Mahjong',
  'Maids',
  'Makeup',
  'Male Harem',
  'Male Protagonist',
  'Marriage',
  'Martial Arts',
  'Matchmaking',
  'Matriarchy',
  'Medicine',
  'Medieval',
  'Memory Manipulation',
  'Mermaid',
  'Meta',
  'Metal Music',
  'Military',
  'Mixed Gender Harem',
  'Mixed Media',
  'Monster Boy',
  'Monster Girl',
  'Mopeds',
  'Motorcycles',
  'Mountaineering',
  'Musical Theater',
  'Mythology',
  'Natural Disaster',
  'Necromancy',
  'Nekomimi',
  'Ninja',
  'No Dialogue',
  'Noir',
  'Non-fiction',
  'Nudity',
  'Nun',
  'Office',
  'Office Lady',
  'Oiran',
  'Ojou-sama',
  'Orphan',
  'Otaku Culture',
  'Outdoor Activities',
  'Pandemic',
  'Parenthood',
  'Parkour',
  'Parody',
  'Philosophy',
  'Photography',
  'Pirates',
  'Poker',
  'Police',
  'Politics',
  'Polyamorous',
  'Post-Apocalyptic',
  'POV',
  'Pregnancy',
  'Primarily Adult Cast',
  'Primarily Animal Cast',
  'Primarily Child Cast',
  'Primarily Female Cast',
  'Primarily Male Cast',
  'Primarily Teen Cast',
  'Prison',
  'Proxy Battle',
  'Psychosexual',
  'Puppetry',
  'Rakugo',
  'Real Robot',
  'Rehabilitation',
  'Reincarnation',
  'Religion',
  'Rescue',
  'Restaurant',
  'Revenge',
  'Robots',
  'Rock Music',
  'Rotoscoping',
  'Royal Affairs',
  'Rugby',
  'Rural',
  'Samurai',
  'Satire',
  'School',
  'School Club',
  'Scuba Diving',
  'Seinen',
  'Shapeshifting',
  'Ships',
  'Shogi',
  'Shoujo',
  'Shounen',
  'Shrine Maiden',
  'Skateboarding',
  'Skeleton',
  'Slapstick',
  'Slavery',
  'Snowscape',
  'Software Development',
  'Space',
  'Space Opera',
  'Spearplay',
  'Steampunk',
  'Stop Motion',
  'Succubus',
  'Suicide',
  'Sumo',
  'Super Power',
  'Super Robot',
  'Superhero',
  'Surfing',
  'Surreal Comedy',
  'Survival',
  'Swimming',
  'Swordplay',
  'Table Tennis',
  'Tanks',
  'Tanned Skin',
  'Teacher',
  "Teens' Love",
  'Tennis',
  'Terrorism',
  'Time Loop',
  'Time Manipulation',
  'Time Skip',
  'Tokusatsu',
  'Tomboy',
  'Torture',
  'Tragedy',
  'Trains',
  'Transgender',
  'Travel',
  'Triads',
  'Tsundere',
  'Twins',
  'Unrequited Love',
  'Urban',
  'Urban Fantasy',
  'Vampire',
  'Vertical Video',
  'Veterinarian',
  'Video Games',
  'Vikings',
  'Villainess',
  'Virtual World',
  'Vocal Synth',
  'Volleyball',
  'VTuber',
  'War',
  'Werewolf',
  'Wilderness',
  'Witch',
  'Work',
  'Wrestling',
  'Writing',
  'Wuxia',
  'Yakuza',
  'Yandere',
  'Youkai',
  'Yuri',
  'Zombie',
];

searchRouter.post('/', async (req: express.Request, res: express.Response): Promise<void> => {
  const result = searchPayloadSchema.safeParse(req.body);
  if (!result.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      error: result.error.errors.map((e) => e.message).join(', '),
    } as APIResponse);
    return;
  }

  try {
    const { query: searchQuery } = result.data;
    let filtered: SearchResult[] | null = null;
    let params: string | null = null;

    
    let model: string = 'google/gemini-2.5-flash';
    
    try{
      const id = await extractUserId(req);
      if (id) {
        const db = await getDatabase();
        const user = await db.collection<User>(Collections.USERS).findOne({ _id: id });
        if (user?.contentSettings.model) {
          model = user.contentSettings.model;
        }
      }} catch (e) {
        console.log("Anonymous user detected")
      }

    if (searchQuery.trim().length > 0) {
      async function askAI(
        prompt: string,
        argName: string,
        type: string,
        postProcess: (q: string) => string | null = (q) => q
      ): Promise<SearchResult | null> {
        const response = await chat(prompt, searchQuery, model);
        if (!response) return null;

        let parsed: string | null = null;
        try {
          parsed = postProcess(response);
        } catch {
          return null;
        }
        if (parsed == null) return null;

        try {
          return {
            key: argName,
            type,
            value: JSON.parse(parsed),
          };
        } catch {
          return {
            key: argName,
            type,
            value: parsed,
          };
        }
      }

      const today = new Date().toLocaleString().split(',')[0].split('/');
      today.reverse();
      today[1] = parseInt(today[1]) < 10 ? '0' + today[1] : today[1];
      today[2] = parseInt(today[2]) < 10 ? '0' + today[2] : today[2];

      const a = await Promise.all([
        askAI(
          `Answer "MANGA" or "ANIME" or "null" regarding whether the query is asking for a manga or anime or both. If the query has both, answer "null". Do not answer anything else besides the specified values. Do not make any inferences and guess based on the query.`,
          'type',
          'MediaType',
          (q) => findClosestOf(['ANIME', 'MANGA'], q)
        ),
        askAI(
          `Answer "WINTER" or "SPRING" or "SUMMER" or "FALL" or "null" regarding whether the query is asking for a specific season or not. If the query does not specify a season, answer "null". Do not answer anything else besides the specified values. Do not make any inferences and guess.`,
          'season',
          'MediaSeason',
          (q) => findClosestOf(['WINTER', 'SPRING', 'SUMMER', 'FALL'], q)
        ),
        askAI(
          `The year is ${new Date().getFullYear()}. Answer an unsigned integer representing a calendar year regarding whether the query is asking for a **specific** (not range) year. If the query does not specify a specific year, answer "null". If the query has any duration (e.g. 1 year ago, 1 month ago, etc.), answer "null". Do not answer anything else besides the specified values. If there is a time frame within the year (but does not specify end or start), please also answer with that calendar year`,
          'seasonYear',
          'Int'
        ),
        askAI(
          `Today is ${today}. Answer an 8-digit long date integer (YYYYMMDD) regarding whether the query wants all media that will start (or have started) after a specified date or time (e.g. "all mangas that will start / have started in 2023"). If the query does not ask for this, answer "null". Do not answer anything else besides the specified values.`,
          'startDate_greater',
          'FuzzyDateInt'
        ),
        askAI(
          `Today is ${today}. Answer an 8-digit long date integer (YYYYMMDD) regarding whether the query wants all media that will or have not started until a specified date (e.g. "all mangas that have not started / will not start in 2024 and onwards"). If the query does not include this, answer "null". Do not answer anything else besides the specified values.`,
          'startDate_lesser',
          'FuzzyDateInt'
        ),
        askAI(
          `Today is ${today}. Answer an 8-digit long date integer (YYYYMMDD) regarding whether the query wants all media whose end date is greater than a specified date (e.g. all anime that will end after 2021). If the query does not include this, answer "null". Do not answer anything else besides the specified values.`,
          'endDate_greater',
          'FuzzyDateInt'
        ),
        askAI(
          `Answer "TV" or "TV_SHORT" or "MOVIE" or "SPECIAL" or "OVA" or "ONA" or "MUSIC" or "MANGA" or "NOVEL" or "ONE_SHOT" regarding whether the query is asking for a specific media format or not. If the query does not specify a media format or if there is more than one media format specified, answer "null". Do not answer anything else besides the specified values. Do not make any inferences and guess based on the query.`,
          'format',
          'MediaFormat',
          (q) =>
            findClosestOf(
              ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC', 'MANGA', 'NOVEL', 'ONE_SHOT'],
              q
            )
        ),
        askAI(
          `Answer "FINISHED" or "RELEASING" or "NOT_YET_RELEASED" or "CANCELLED" or "HIATUS" regarding whether the query is asking for a specific media status or not. Do not infer the media status from other information (e.g. time). If the query does not specify a media status, answer "null". Do not answer anything else besides the specified values. Do not make any inferences and guess.`,
          'status',
          'MediaStatus',
          (q) => findClosestOf(['FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'], q)
        ),
        askAI(
          `Answer "ORIGINAL" or "MANGA" or "LIGHT_NOVEL" or "VISUAL_NOVEL" or "VIDEO_GAME" or "OTHER" or "NOVEL" or "DOUJINSHI" or "ANIME" or "WEB_NOVEL" or "LIVE_ACTION" or "GAME" or "COMIC" or "MULTIMEDIA_PROJECT" or "PICTURE_BOOK" regarding whether the query explicitly states the media source that the media comes from (it has to explicitly mention that there is a media source that it adapted from, e.g. "manga from anime series" or "anime from light novel"). Unless the query **explicitly** mentions this, answer "null"`,
          'source',
          'MediaSource',
          (q) =>
            findClosestOf(
              [
                'ORIGINAL',
                'MANGA',
                'LIGHT_NOVEL',
                'VISUAL_NOVEL',
                'VIDEO_GAME',
                'OTHER',
                'NOVEL',
                'DOUJINSHI',
                'ANIME',
                'WEB_NOVEL',
                'LIVE_ACTION',
                'GAME',
                'COMIC',
                'MULTIMEDIA_PROJECT',
                'PICTURE_BOOK',
              ],
              q
            )
        ),
        askAI(
          `${genres}
			
			Given a list of genres, answer "null" if the query does not specify to **include** any genres. Otherwise, answer a comma-separated list of genres that the query specifies to **include**. If a list of genres is given with some genres to exclude, assume that the genres that are not excluded are included. (e.g. "Romance but not Adult nor Ecchi" should be just "Romance") Do not answer anything else besides the specified values. Do not make any presumptions and guess.`,
          'genre_in',
          '[String]'
        ),
        askAI(
          `${genres}
			
			Given a list of genres, answer "null" if the query does not specify to **exclude** any genres. Otherwise, answer a comma-separated list of genres that the query specifies to **exclude** the genres. Do not answer anything else besides the specified values. Do not make any presumptions and guess.`,
          'genre_not_in',
          '[String]'
        ),
        askAI(
          'Answer "true" or "false" or "null" if the query specifies that the media is 18+. If the query does not even mention about 18+ or is vague/unsure (or not specific such as "its hentai/adult but not hentai/adult"), answer "null", but if they specify concern or want for 18+, then answer with the appropriate boolean value. 18+ in this context means with sexual intercourse or just plain hentai. Do not answer anything else besides the specified values.',
          'isAdult',
          'Boolean'
        ),
        askAI(
          `Answer an integer from 1 to 100 or "null" regarding if the query specifies a **minimum** rating for a media. If the query mentions subjective words such as "good" or "great", please use the following mapping as reference for such categories if and only if it is mentioned that the media *must* meet the minimum requirement or at least meets the criteria (note this is not asking for at most/or maximum rating limit):
			
			Top-tier/Best/Perfect => 85
			Great/Excellent => 80
			Good/Decent/Average => 70
			Mid/Okay/So-so => 60
			Bad/Poor => 0
			`,
          'averageScore_greater',
          'Int'
        ),
        askAI(
          `Answer an integer from 1 to 100 or "null" regarding if the query specifies a **maximum** rating for a media. If the query mentions subjective words such as "good" or "great", please use the following mapping as reference for such categories if and only if it is mentioned that the media's rating *must* be below the requirement or is within the criteria (note this is not asking for at most/or minimum rating but rather all medias that are not above the rating):
			
			Top-tier/Best/Perfect => 85
			Great/Excellent => 80
			Good/Decent/Average => 70
			Mid/Okay/So-so => 60
			Bad/Poor => 0
			`,
          'averageScore_lesser',
          'Int'
        ),
        askAI(
          `Extract a specific media title (or fragment) from the query if present. Follow these rules:

					EXTRACT THE TITLE WHEN:
					- The query is an exact media title (e.g., "That time I got reincarnated as a slime" → "That time I got reincarnated as a slime")
					- The query clearly asks about a specific title (e.g., "Tell me about Sword Art Online" → "Sword Art Online")
					- The query contains a search for a partial title (e.g., "anime with 'sword' in the title" → "sword")
					- The query asks for a title with specific identifying characteristics (e.g., "What's the title of the anime that begins with 'One'?" → "One")
				
					DO NOT EXTRACT AND RETURN "null" WHEN:
					- The query contains subjective descriptors like "best", "peak", "good", "top" (e.g., "peak light novel" → "null")
					- The query asks for recommendations similar to a title (e.g., "Anime similar to Sword Art Online" → "null")
					- The query describes general media types, genres, or concepts (e.g., "light novel", "romance anime" → "null")
					- The query uses a title only as a reference point (e.g., "Is there anything better than One Piece?" → "null")
					- The query contains general qualifiers or adjectives with media formats (e.g., "popular anime", "trending manga" → "null")
					- The query is ambiguous or could be interpreted as either a title search or a descriptive search
					- You're uncertain whether the query contains a specific title
				
					A single word or short phrase should only be considered a title if it's distinctive and unlikely to be a general descriptor (e.g., "Naruto" is a title, but "romance" is not).
				
					Always prioritize precision over recall. If in doubt, return "null".`,
          'search',
          'String'
        ),
      ]);

      filtered = a.filter((x): x is SearchResult => x != null && x.value != null);
      params = filtered.map((x) => `$${x.key}: ${x.type}`).join(', ');
    }

    const query = `
	query($page: Int, $perPage: Int${params ? `, ${params}` : ''}) {
		Page(page: $page, perPage: $perPage) {
			media${params && filtered ? `(${filtered.map((x) => `${x.key}: $${x.key}`).join(', ')})` : ''} {
				season
				title {
					english
					native
					romaji
				}
				popularity
				averageScore
				genres
				format
				description
				chapters
				episodes
				coverImage {
					large
					extraLarge
				}
				endDate {
					day
					month
					year
				}
				seasonYear
				siteUrl
				status
				type
				volumes
				isAdult
				id
			}
		}
	}
	`;

    const body = {
      query,
      variables:
        filtered?.reduce<Record<string, unknown>>(
          (prev, curr) => {
            if (curr.key.includes('_in') && typeof curr.value === 'string') {
              prev[curr.key] = curr.value.split(',').map((item) => item.trim());
              return prev;
            }

            if (curr.type === 'FuzzyDateInt' && prev['season'] != null && typeof curr.value === 'number') {
              if (curr.key === 'startDate_greater') {
                prev[curr.key] = curr.value % 1000 < 401 ? curr.value - 10000 : curr.value - 300;
              } else {
                prev[curr.key] = curr.value % 1000 < 932 ? curr.value + 300 : curr.value + 10000;
              }
              return prev;
            }

            prev[curr.key] = curr.value;
            return prev;
          },
          {
            perPage: 50,
            page: 1,
          }
        ) ?? {},
    };

    if (body.variables?.format === 'MANGA') {
      delete body.variables?.seasonYear;
    }

    console.log(body.variables);

    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const aniListData = await response.json();

    res.status(StatusCodes.OK).json({
      data: aniListData.data.Page.media,
      status: StatusCodes.OK,
    } as APIResponse);
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: err instanceof Error ? err.message : 'Unknown error',
    } as APIResponse);
    return;
  }
});

export default searchRouter;
