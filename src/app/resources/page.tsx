'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  BookOpen,
  Search,
  ExternalLink,
  Palette,
  Landmark,
  Trees,
  GraduationCap,
  UtensilsCrossed,
  MapPin,
  Heart,
  Bus,
  Users,
  Newspaper,
  ShoppingBag,
  Trophy,
} from 'lucide-react'
import { MobileNavigation } from '@/components/dashboard/MobileNavigation'

// ============================================
// Resource Data
// ============================================

interface Resource {
  name: string
  description: string
  url?: string
  address?: string
}

interface ResourceCategory {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  resources: Resource[]
}

const CATEGORIES: ResourceCategory[] = [
  {
    id: 'government',
    title: 'City Government & Services',
    icon: <Landmark className="h-4 w-4" />,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    resources: [
      { name: 'City of Sioux City', description: 'City Hall — permits, licenses, payments, public meetings', url: 'https://www.sioux-city.org/', address: '405 6th Street' },
      { name: 'City Utilities', description: 'Water, sewer, and solid waste services', url: 'https://www.sioux-city.org/services/utilities' },
      { name: 'Sioux City Police Department', description: 'Non-emergency line: (712) 279-6960', url: 'https://www.sioux-city.org/government/departments-q-to-z/police-department' },
      { name: 'Sioux City Fire Rescue', description: 'Fire department and emergency medical services', url: 'https://www.sioux-city.org/government/departments-g-p/fire-rescue' },
      { name: 'Community Development', description: 'Housing, planning, zoning, and code enforcement', url: 'https://www.sioux-city.org/government/departments-a-f/community-development' },
      { name: 'Public Works', description: 'Streets, stormwater, engineering, and fleet services', url: 'https://www.sioux-city.org/government/departments-q-to-z/public-works' },
    ],
  },
  {
    id: 'arts-culture',
    title: 'Arts & Culture',
    icon: <Palette className="h-4 w-4" />,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    resources: [
      { name: 'Sioux City Art Center', description: 'Contemporary art museum with rotating exhibitions and permanent collection', url: 'https://siouxcityartcenter.org/' },
      { name: 'Sioux City Public Museum', description: 'Regional history, natural science, and geology exhibits', url: 'https://www.siouxcitymuseum.org/' },
      { name: 'Orpheum Theatre', description: 'Historic 2,600-seat performing arts venue built in 1927', url: 'https://www.orpheumlive.com/' },
      { name: 'Sioux City Symphony Orchestra', description: 'Professional orchestra with a full season of concerts', url: 'https://www.siouxcitysymphony.org/' },
      { name: 'Sergeant Floyd River Museum', description: 'Missouri River history and Welcome Center', url: 'https://www.siouxcitymuseum.org/' },
      { name: 'LaunchPAD Children\'s Museum', description: 'Interactive hands-on exhibits for kids', url: 'https://www.launchpadmuseum.com/' },
    ],
  },
  {
    id: 'parks-recreation',
    title: 'Parks & Recreation',
    icon: <Trees className="h-4 w-4" />,
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    resources: [
      { name: 'Sioux City Parks & Recreation', description: '59 parks, 33 miles of trails, 3 pools, 7 splash pads', url: 'https://www.sioux-city.org/government/departments-g-p/parks-recreation-department' },
      { name: 'Cone Park', description: 'Year-round — tubing hill, ice skating, mountain bike trails, summer activities', url: 'https://www.sioux-city.org/government/departments-g-p/parks-recreation-department/cone-park' },
      { name: 'Bacon Creek Park', description: 'Playgrounds, dog park, fishing, kayaking, and multi-use trails' },
      { name: 'Riverside Park', description: '100-acre park with Sioux City\'s best public pool and playgrounds' },
      { name: 'Stone State Park', description: '1,000+ acres of trails, camping, and Loess Hills views', url: 'https://www.iowadnr.gov/Places-to-Go/State-Parks/Iowa-State-Parks/Stone-State-Park' },
      { name: 'Dorothy Pecaut Nature Center', description: 'Loess Hills exhibits, hiking trails, and raptor house' },
      { name: 'ibp Ice Center', description: 'Indoor ice skating and hockey facility', address: '3808 Stadium Drive' },
    ],
  },
  {
    id: 'education',
    title: 'Education & Libraries',
    icon: <GraduationCap className="h-4 w-4" />,
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    resources: [
      { name: 'Sioux City Community School District', description: '14,200 students across 3 high schools and multiple elementary/middle schools', url: 'https://www.siouxcityschools.org/' },
      { name: 'Morningside University', description: 'Private university on Sioux City\'s east side', url: 'https://www.morningside.edu/' },
      { name: 'Briar Cliff University', description: 'Private Franciscan university overlooking the Missouri River valley', url: 'https://www.briarcliff.edu/' },
      { name: 'Western Iowa Tech Community College', description: 'Community college with career and technical programs', url: 'https://www.witcc.edu/' },
      { name: 'Sioux City Public Library', description: 'Three locations — Aalfs Downtown, Morningside Branch, and Perry Creek Branch', url: 'https://www.siouxcitylibrary.org/' },
    ],
  },
  {
    id: 'dining',
    title: 'Dining & Nightlife',
    icon: <UtensilsCrossed className="h-4 w-4" />,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    resources: [
      { name: 'Marto Brewing Co.', description: 'Craft brewery with wood-fired Neapolitan pizza', url: 'https://martobrewing.com/', address: '930 4th Street' },
      { name: 'Jackson Street Brewing', description: 'Local craft brewery with 609 event space', url: 'https://jacksonstreetbrewing.com/' },
      { name: 'The Diving Elk', description: 'Craft beverages, comfort food, and a seasonal menu' },
      { name: 'Woodbury\'s at The Warrior', description: 'Upscale rustic American cuisine in the historic Warrior Hotel' },
      { name: 'Miles Inn', description: 'Legendary neighborhood bar — home of the Charlie Boy loose-meat sandwich' },
      { name: 'Buffalo Alice', description: 'Pizza, beer, vintage vibes, and a great back patio', address: '1022 4th Street' },
      { name: 'Trattoria Fresco', description: 'Italian-inspired dining on Historic 4th Street' },
    ],
  },
  {
    id: 'things-to-do',
    title: 'Things to Do',
    icon: <MapPin className="h-4 w-4" />,
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    resources: [
      { name: 'Hard Rock Hotel & Casino', description: 'Gaming, live entertainment, and dining', url: 'https://www.hardrockcasinosiouxcity.com/' },
      { name: 'Palmer\'s Olde Tyme Candy Shoppe', description: 'Candy museum and old-fashioned candy shop' },
      { name: 'Lewis & Clark Interpretive Center', description: 'Interactive exhibits about the Corps of Discovery expedition' },
      { name: 'Mid America Museum of Aviation & Transportation', description: 'Full-size aircraft, vintage vehicles, and a Boeing 727' },
      { name: 'Historic Fourth Street District', description: 'Shops, pubs, and restaurants in restored 19th-century buildings' },
      { name: 'Saturday in the Park', description: 'Free annual music festival at Grandview Park (July)' },
      { name: 'Flight 232 Memorial', description: 'Riverfront memorial honoring the 1989 crash survivors and responders' },
      { name: 'War Eagle Monument', description: 'Bluff-top monument with panoramic tri-state views' },
    ],
  },
  {
    id: 'sports',
    title: 'Sports & Outdoors',
    icon: <Trophy className="h-4 w-4" />,
    color: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
    resources: [
      { name: 'Tyson Events Center', description: '10,000-seat arena for concerts, sports, and events', url: 'https://www.tysoncenter.com/' },
      { name: 'Sioux City Musketeers', description: 'USHL hockey — developing future NHL talent', url: 'https://musketeershockey.com/' },
      { name: 'Sioux City Explorers', description: 'American Association independent baseball', url: 'https://aabaseball.com/team/sioux-city-explorers/' },
      { name: 'Sioux City Bandits', description: 'National Arena League indoor football' },
      { name: 'Cone Park Mountain Bike Trails', description: '10.5 miles of trails from beginner to advanced' },
      { name: 'Disc Golf', description: '3 free public courses — Grandview, Leif Erikson, and Sertoma parks' },
      { name: 'Missouri & Big Sioux Rivers', description: 'Fishing, kayaking, and canoeing access points' },
    ],
  },
  {
    id: 'shopping',
    title: 'Shopping',
    icon: <ShoppingBag className="h-4 w-4" />,
    color: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
    resources: [
      { name: 'Southern Hills Mall', description: '~100 retailers anchored by Scheels and JCPenney', url: 'https://www.southernhillsmall.com/', address: '4400 Sergeant Road' },
      { name: 'Lakeport Commons', description: '500,000+ sq ft outdoor lifestyle center (Kohl\'s, Best Buy, Old Navy)' },
      { name: 'Historic Fourth Street', description: 'Boutiques, antique shops, and specialty stores downtown' },
      { name: 'Historic Pearl District', description: 'Westside downtown shops, pubs, and services' },
      { name: 'Thinker Toys', description: 'Castle-shaped toy store with games and puzzles' },
    ],
  },
  {
    id: 'health',
    title: 'Health & Safety',
    icon: <Heart className="h-4 w-4" />,
    color: 'bg-red-500/10 text-red-500 border-red-500/30',
    resources: [
      { name: 'MercyOne Siouxland Medical Center', description: 'Only Level II Trauma Center in western Iowa', url: 'https://www.mercyone.org/location/mercyone-siouxland-medical-center' },
      { name: 'UnityPoint Health - St. Luke\'s', description: '464-bed hospital and regional health system', url: 'https://www.unitypoint.org/locations/unitypoint-health---st-lukes', address: '801 5th Street' },
      { name: 'Siouxland Community Health Center', description: 'Federally qualified health center with 3 locations — sliding fee scale', url: 'https://www.slandchc.com/' },
      { name: 'Siouxland District Health Department', description: 'Public health agency for Woodbury County', address: '1014 Nebraska Street' },
      { name: 'Emergency Services', description: 'Call 911 for police, fire, and ambulance' },
    ],
  },
  {
    id: 'transportation',
    title: 'Transportation',
    icon: <Bus className="h-4 w-4" />,
    color: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
    resources: [
      { name: 'Sioux Gateway Airport (SUX)', description: 'American Airlines to Chicago O\'Hare and Denver', url: 'https://flysux.com/' },
      { name: 'Sioux City Transit', description: '10 bus routes, Monday–Saturday 7am–7pm', url: 'https://www.sioux-city.org/government/departments-q-to-z/transit' },
      { name: 'MLK Jr. Transportation Center', description: 'Downtown bus transfer hub', address: '505 Nebraska Street' },
      { name: 'Interstate 29', description: 'North-south corridor connecting Kansas City to the Canadian border' },
      { name: 'US Highway 20', description: 'East-west corridor across northern Iowa' },
    ],
  },
  {
    id: 'community',
    title: 'Community Organizations',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
    resources: [
      { name: 'Siouxland Chamber of Commerce', description: 'Business advocacy and economic development', url: 'https://www.siouxlandchamber.com/', address: '101 Pierce Street' },
      { name: 'United Way of Siouxland', description: 'Community impact programs and volunteer coordination', url: 'https://www.unitedwaysiouxland.com/', address: '701 Steuben Street' },
      { name: 'Food Bank of Siouxland', description: 'Fighting hunger across the tri-state region', url: 'https://www.siouxlandfoodbank.org/', address: '1313 11th Street' },
      { name: 'Siouxland Habitat for Humanity', description: 'Affordable housing and community building', url: 'https://www.siouxlandhabitat.org/' },
      { name: 'Downtown Partners', description: 'Downtown Sioux City development and events', url: 'https://downtownsiouxcity.com/' },
      { name: 'Siouxland Center for Active Generations', description: 'Programs and services for older adults' },
    ],
  },
  {
    id: 'news-media',
    title: 'News & Media',
    icon: <Newspaper className="h-4 w-4" />,
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    resources: [
      { name: 'Sioux City Journal', description: 'Daily newspaper covering Siouxland since 1864', url: 'https://siouxcityjournal.com/' },
      { name: 'KTIV', description: 'NBC affiliate — local TV news', url: 'https://www.ktiv.com/' },
      { name: 'KCAU 9 News', description: 'ABC affiliate — local TV news', url: 'https://siouxlandnews.com/' },
      { name: 'KMEG / KPTH Fox 44', description: 'Sinclair Broadcasting — local TV news', url: 'https://www.siouxlandproud.com/' },
      { name: 'KWIT', description: 'Siouxland Public Media — NPR affiliate and public radio', url: 'https://www.kwit.org/' },
      { name: 'KSCJ 1360 AM / 94.9 FM', description: 'News, talk, and sports radio since 1927', url: 'https://kscj.com/' },
      { name: 'Explore Siouxland', description: 'Tourism and events guide', url: 'https://exploresiouxland.com/' },
    ],
  },
]

// ============================================
// Resource Card
// ============================================

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              {resource.name}
              <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
            </a>
          ) : (
            <span className="font-medium text-sm">{resource.name}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{resource.description}</p>
        {resource.address && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{resource.address}</p>
        )}
      </div>
    </div>
  )
}

// ============================================
// Category Section
// ============================================

function CategorySection({ category }: { category: ResourceCategory }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-5 pb-2">
        <div className="flex items-center gap-2.5 mb-3">
          <Badge variant="outline" className={category.color}>
            {category.icon}
          </Badge>
          <h2 className="font-semibold text-sm">{category.title}</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {category.resources.length}
          </span>
        </div>
        <div className="divide-y divide-border/50">
          {category.resources.map((resource) => (
            <ResourceCard key={resource.name} resource={resource} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Main Page
// ============================================

export default function ResourcesPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return CATEGORIES.map((cat) => {
      if (activeCategory && cat.id !== activeCategory) return null
      if (!q) return cat
      const matchingResources = cat.resources.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      )
      if (matchingResources.length === 0) return null
      return { ...cat, resources: matchingResources }
    }).filter(Boolean) as ResourceCategory[]
  }, [search, activeCategory])

  const totalResources = CATEGORIES.reduce((sum, c) => sum + c.resources.length, 0)

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Sioux City Resources</h1>
              <p className="text-sm text-muted-foreground">
                {totalResources} local resources across {CATEGORIES.length} categories
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          <Badge
            variant={activeCategory === null ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => setActiveCategory(null)}
          >
            All
          </Badge>
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() =>
                setActiveCategory(activeCategory === cat.id ? null : cat.id)
              }
            >
              {cat.title}
            </Badge>
          ))}
        </div>

        {/* Resource sections */}
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <Search className="h-12 w-12 text-muted-foreground/30" />
                <div>
                  <h3 className="font-medium text-muted-foreground">
                    No resources found
                  </h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Try a different search term or category
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>

      <MobileNavigation />
    </main>
  )
}
