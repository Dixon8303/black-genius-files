/* ============================================================================
   DATA MODEL — episodes, dossiers, timeline, quiz, cipher, book chapters.
   Ported verbatim from the design spec (design_handoff_black_genius_files/
   "Black Genius Files goldinksite.dc.html"). Edit content here, not in
   index.html or app.js.
   ============================================================================ */
(function () {
  "use strict";

  var YT = {
    channelId: "UC_IKlYsCAAA0iLGA-lQTLWA",
    url: "https://www.youtube.com/@theblackgeniusfiles",
    sub: "https://www.youtube.com/@theblackgeniusfiles?sub_confirmation=1",
    proxies: [
      function (u) { return "https://api.allorigins.win/raw?url=" + encodeURIComponent(u); },
      function (u) { return "https://corsproxy.io/?url=" + encodeURIComponent(u); }
    ]
  };

  // Launch-slate fallback episodes, shown until the live YouTube sync (API or RSS) succeeds.
  var SEED = [
    {id:12,title:"The Real Economics of Black Wall Street — In Today's Dollars",tag:"Economics & Business",hook:"Vindication + Pride",desc:"Greenwood's Black Wall Street, rebuilt in today's dollars — the ecosystem that was engineered, and the night it was erased."},
    {id:11,title:"10 Inventions You Use Daily That Were Created by Black Innovators",tag:"Innovation & Science",hook:"Revelation + Pride",desc:"Ten technologies in your everyday life — and the Black innovators written out of their origin stories."},
    {id:10,title:"The African Kingdom That Was Richer Than Medieval Europe",tag:"African Civilizations",hook:"Revelation + Pride",desc:"An empire whose wealth and sophistication outstripped its European contemporaries — erased from the curriculum by design."},
    {id:9,title:"The Black Mathematician Who Made NASA's Moon Landing Possible",tag:"Innovation & Science",hook:"Vindication + Revelation",figureId:"johnson",desc:"The hand calculations that put America on the Moon — and the mathematician NASA trusted over the machine."},
    {id:8,title:"How Madam C.J. Walker Built a Beauty Empire Before Marketing Existed",tag:"Economics & Business",hook:"Pride + Vindication",figureId:"walker",desc:"From washerwoman to the first self-made female millionaire in America — the business architecture behind the empire."},
    {id:7,title:"How Mansa Musa Crashed an Entire Continent's Economy",tag:"African Civilizations",hook:"Revelation + Pride",desc:"The richest man who ever lived — and the pilgrimage whose generosity destabilized economies for a decade."},
    {id:6,title:"How Granville Woods Outpatented Thomas Edison — Twice",tag:"Innovation & Science",hook:"Vindication + Revelation",figureId:"woods",desc:"The inventor they called the Black Edison held some 60 patents — and beat Edison in court, twice."},
    {id:5,title:"How Berry Gordy Turned $800 Into a $400 Million Empire",tag:"Economics & Business",hook:"Pride + Nostalgia",desc:"Motown was not a label. It was an assembly line for culture, engineered with factory-floor precision."},
    {id:4,title:"How Motown's Quality Control System Invented Modern Pop Marketing",tag:"Music & Cinema",hook:"Nostalgia + Pride",desc:"The Friday meeting that decided every release — and quietly wrote the blueprint for modern marketing."},
    {id:3,title:"The HBCU System — How Black Colleges Built a Middle Class",tag:"Civil Rights & Culture",hook:"Pride + Rediscovery",desc:"The institutions that built Black America's professional class — and the economic infrastructure behind them."},
    {id:2,title:"The Economics of Redlining — How Maps Destroyed Black Wealth",tag:"Economics & Business",hook:"Vindication + Revelation",desc:"How a set of color-coded maps engineered generational wealth destruction — deliberately, and by policy."},
    {id:1,title:"How the Harlem Renaissance Rewrote American Identity",tag:"Civil Rights & Culture",hook:"Pride + Nostalgia",desc:"The cultural revolution that redefined American art and identity — and the question of who really funded it."}
  ];

  var FIGURES = [
    {id:"banneker",name:"Benjamin Banneker",field:"Science",era:"Foundations",years:"1731–1806",arch:"Oracle",bio:"A free Black man in colonial Maryland who taught himself astronomy and mathematics, built one of the first clocks made entirely in America, and published widely-read almanacs.",ach:["Accurately predicted a 1789 solar eclipse","Published six almanacs from his own calculations","Challenged Thomas Jefferson on slavery in a famous 1791 letter"],built:"Almanacs, eclipse tables, and the survey lines of a national capital — an observatory built from a borrowed telescope.",against:"A plantation legal order, and Jefferson's public doubt that Black intellect existed.",cost:"A century of American science denied its first astronomer.",learn:"https://en.wikipedia.org/wiki/Benjamin_Banneker"},
    {id:"wheatley",name:"Phillis Wheatley",field:"Literature",era:"Foundations",years:"c.1753–1784",arch:"Keeper",bio:"Kidnapped from West Africa as a child, she became the first African American to publish a book of poetry — and had to defend her authorship before a panel of colonial notables.",ach:["First African American to publish a book of poetry (1773)","Praised by figures including George Washington","Gained her freedom shortly after publication"],built:"The first published book of poetry by an African American — proof of authorship the colony demanded she defend in court.",against:"A colonial press and legal system that presumed a Black poet impossible.",cost:"Generations of literature lost to the presumption that genius had one color.",learn:"https://en.wikipedia.org/wiki/Phillis_Wheatley"},
    {id:"tubman",name:"Harriet Tubman",field:"Liberation",era:"Foundations",years:"c.1822–1913",arch:"Rebel",bio:"Escaped slavery and returned south roughly 13 times to guide about 70 enslaved people to freedom via the Underground Railroad. Later a Union scout, spy, and nurse.",ach:["Guided ~70 people to freedom and never lost a passenger","First woman to lead an armed assault in the Civil War (1863)","Lifelong advocate for suffrage and elder care"],built:"A working escape network — routes, signals, safe houses — run without losing a single passenger.",against:"The Fugitive Slave Act and the armed economy it protected.",cost:"The republic warred against its own best military scout.",learn:"https://en.wikipedia.org/wiki/Harriet_Tubman"},
    {id:"douglass",name:"Frederick Douglass",field:"Abolition",era:"Foundations",years:"1818–1895",arch:"Oracle",bio:"Born enslaved, he escaped to become the most photographed American of the 19th century — a towering orator, writer, and statesman for abolition and equal rights.",ach:["Authored three landmark autobiographies","Published the abolitionist paper The North Star","Advised President Lincoln during the Civil War"],built:"A national argument — three autobiographies, a newspaper, and the most photographed face of the century.",against:"A publishing establishment that claimed no enslaved man could have written them.",cost:"Decades of policy made without the country's clearest witness.",learn:"https://en.wikipedia.org/wiki/Frederick_Douglass"},
    {id:"wells",name:"Ida B. Wells",field:"Journalism",era:"Resistance",years:"1862–1931",arch:"Rebel",bio:"Investigative journalist and activist who led a fearless anti-lynching crusade, documenting racial terror with data and courage decades before the field existed.",ach:["Pioneered data-driven investigative reporting on lynching","Co-founded the NAACP (1909)","Posthumous Pulitzer Prize special citation (2020)"],built:"The evidentiary record of lynching in America — counted, named, and published when no institution would.",against:"A Southern press that justified the violence and mobs that burned her presses.",cost:"Sixty years passed before the data she compiled was acted upon.",learn:"https://en.wikipedia.org/wiki/Ida_B._Wells"},
    {id:"washington",name:"Booker T. Washington",field:"Education",era:"Resistance",years:"1856–1915",arch:"Builder",bio:"Born enslaved, he became the founding leader of Tuskegee Institute and the most influential Black educator and orator of his era.",ach:["Founded and built Tuskegee Institute (1881)","Advised U.S. presidents on race and policy","Authored the classic memoir 'Up From Slavery'"],built:"Tuskegee — an institution that trained builders, teachers, and farmers by the thousand.",against:"A state school system funded to keep Black education manual and minimal.",cost:"An industrial model of uplift the nation studied abroad and starved at home.",learn:"https://en.wikipedia.org/wiki/Booker_T._Washington"},
    {id:"dubois",name:"W.E.B. Du Bois",field:"Scholarship",era:"Resistance",years:"1868–1963",arch:"Architect",bio:"Sociologist, historian, and activist — the first African American to earn a Harvard PhD — whose scholarship and organizing shaped the modern civil rights movement.",ach:["First African American to earn a Harvard PhD (1895)","Authored 'The Souls of Black Folk' (1903)","Co-founded the NAACP (1909)"],built:"The intellectual architecture of the movement — empirical sociology, The Souls of Black Folk, the NAACP.",against:"An academy that would cite his methods and deny his chair.",cost:"American social science delayed by the color line it refused to study.",learn:"https://en.wikipedia.org/wiki/W._E._B._Du_Bois"},
    {id:"carver",name:"George Washington Carver",field:"Science",era:"Resistance",years:"c.1864–1943",arch:"Builder",bio:"Agricultural scientist who revolutionized Southern farming through crop rotation and developed hundreds of uses for peanuts, sweet potatoes, and soybeans.",ach:["Developed 300+ products from the peanut","Pioneered crop rotation to restore depleted soil","Testified before Congress to international renown"],built:"A regenerative agricultural system — crop rotation and 300 products that revived exhausted Southern soil.",against:"A cotton monoculture and the credit system that enforced it.",cost:"Sustainable farming arrived a half-century later than it had to.",learn:"https://en.wikipedia.org/wiki/George_Washington_Carver"},
    {id:"walker",name:"Madam C.J. Walker",field:"Business",era:"Resistance",years:"1867–1919",arch:"Architect",bio:"Orphaned and widowed young, she built a haircare empire and is widely recorded as the first self-made female millionaire in America — employing thousands of Black women.",ach:["First self-made female millionaire in America (per Guinness)","Built a nationwide sales force of Black women","Major philanthropist for education and civil rights"],built:"A national direct-sales architecture — thousands of trained agents, decades before the model had a name.",against:"Banks and wholesalers closed to a Black washerwoman with a formula.",cost:"The blueprint of modern network marketing, credited to those who copied it.",learn:"https://en.wikipedia.org/wiki/Madam_C._J._Walker"},
    {id:"woodson",name:"Carter G. Woodson",field:"Scholarship",era:"Resistance",years:"1875–1950",arch:"Keeper",bio:"Historian and author, the 'Father of Black History,' and the second Black American to earn a Harvard PhD. He founded the movement that became Black History Month.",ach:["Founded the ASNLH (1915)","Launched Negro History Week in 1926","Authored 'The Mis-Education of the Negro'"],built:"The discipline of Black history itself — the association, the journal, and the week that became a month.",against:"A curriculum that taught Black children they had no past worth recording.",cost:"Every classroom that still teaches the edit instead of the record.",learn:"https://en.wikipedia.org/wiki/Carter_G._Woodson"},
    {id:"morgan",name:"Garrett Morgan",field:"Invention",era:"Renaissance",years:"1877–1963",arch:"Builder",bio:"Self-taught inventor whose safety hood (an early gas mask) and improved three-position traffic signal saved countless lives — often sold under others' names to sidestep racial bias.",ach:["Invented the safety hood / smoke protector (1914)","Patented an improved three-position traffic signal (1923)","Personally led a daring 1916 tunnel rescue"],built:"The safety hood and the three-position traffic signal — devices that still stand at every intersection.",against:"Buyers who would not purchase from a Black inventor, forcing sales under other names.",cost:"Lives lost in the years the market refused the device over its maker.",learn:"https://en.wikipedia.org/wiki/Garrett_Morgan"},
    {id:"latimer",name:"Lewis Latimer",field:"Invention",era:"Renaissance",years:"1848–1928",arch:"Architect",bio:"Draftsman and inventor who improved the electric lightbulb with a longer-lasting carbon filament and drafted the patent drawings for Bell's telephone.",ach:["Patented the carbon filament that made bulbs practical (1882)","Drafted the patent for Bell's telephone","Only Black member of the elite 'Edison Pioneers'"],built:"The carbon filament that made electric light practical, and the drafted patents of the telephone.",against:"An invention economy that kept his name off the patents he drew.",cost:"The lightbulb's true authorship, dimmed for a century.",learn:"https://en.wikipedia.org/wiki/Lewis_Latimer"},
    {id:"woods",name:"Granville Woods",field:"Invention",era:"Renaissance",years:"1856–1910",arch:"Builder",bio:"Prolific inventor called 'the Black Edison,' holding roughly 60 patents — many improving railway communication and electrical systems that saved lives.",ach:["Held ~60 U.S. patents","Invented the synchronous multiplex railway telegraph (1887)","Beat Edison's legal challenges — twice"],built:"Railway telegraphy that let moving trains speak — some sixty patents of working infrastructure.",against:"Edison's legal machine, which sued him twice and lost twice.",cost:"The habit of calling him 'the Black Edison' instead of calling Edison 'the white Woods'.",learn:"https://en.wikipedia.org/wiki/Granville_Woods"},
    {id:"coleman",name:"Bessie Coleman",field:"Aviation",era:"Renaissance",years:"1892–1926",arch:"Rebel",bio:"Denied flight training in the U.S., she learned French, sailed to France, and became the first African American woman — and first Native American woman — to earn a pilot's license.",ach:["First African American woman to hold a pilot license (1921)","Earned an international license from the FAI","Refused to perform for segregated crowds"],built:"An aviation career assembled across an ocean — the first international pilot license held by an African American woman.",against:"Every American flight school, which refused her at the door.",cost:"A generation of pilots trained abroad or not at all.",learn:"https://en.wikipedia.org/wiki/Bessie_Coleman"},
    {id:"drew",name:"Dr. Charles Drew",field:"Medicine",era:"CivilRights",years:"1904–1950",arch:"Builder",bio:"Physician and researcher who pioneered blood plasma storage and organized America's first large-scale blood banks — then resisted the order to segregate blood by race.",ach:["Pioneered large-scale blood plasma banking","Directed the WWII 'Blood for Britain' program","First Black examiner for the American Board of Surgery"],built:"The blood plasma banking system — the wartime supply chain that still saves trauma patients.",against:"The Red Cross and armed forces directive to segregate donated blood.",cost:"He resigned from the system he built; the science said nothing, the policy stood.",learn:"https://en.wikipedia.org/wiki/Charles_R._Drew"},
    {id:"johnson",name:"Katherine Johnson",field:"Mathematics",era:"CivilRights",years:"1918–2020",arch:"Oracle",bio:"NASA 'human computer' whose orbital calculations were so trusted that John Glenn refused to fly until she personally verified the machine's numbers.",ach:["Calculated trajectories for the first U.S. crewed spaceflight (1961)","Verified the math for John Glenn's historic orbit (1962)","Presidential Medal of Freedom (2015)"],built:"The trajectories of Mercury and Apollo — orbital mathematics trusted above the machine.",against:"A NASA that computed her work under 'colored computers' and left her name off reports.",cost:"Sixty years before the nation learned who did the math.",learn:"https://en.wikipedia.org/wiki/Katherine_Johnson"},
    {id:"marshall",name:"Thurgood Marshall",field:"Law",era:"CivilRights",years:"1908–1993",arch:"Architect",bio:"The legal architect of the fight against segregation — he won Brown v. Board of Education and became the first Black Justice of the U.S. Supreme Court.",ach:["Won 29 of 32 cases argued before the Supreme Court","Lead counsel in Brown v. Board of Education (1954)","First African American U.S. Supreme Court Justice (1967)"],built:"The legal demolition of separate-but-equal — twenty-nine Supreme Court victories, case by case.",against:"The doctrine of Plessy and every state statute built upon it.",cost:"Three generations schooled under a lie the Court took sixty years to retire.",learn:"https://en.wikipedia.org/wiki/Thurgood_Marshall"},
    {id:"chisholm",name:"Shirley Chisholm",field:"Politics",era:"Modern",years:"1924–2005",arch:"Rebel",bio:"'Unbought and unbossed.' The first Black woman elected to Congress, and the first Black candidate to seek a major party's nomination for President.",ach:["First Black woman elected to Congress (1968)","First Black candidate for a major party's presidential nomination (1972)","Co-founded the Congressional Black Caucus"],built:"A seat in Congress and a presidential campaign that redrew who could stand for the office.",against:"Both parties' machines, which barred her from the debates.",cost:"The coalition politics she modeled arrived decades behind her.",learn:"https://en.wikipedia.org/wiki/Shirley_Chisholm"},
    {id:"jemison",name:"Dr. Mae Jemison",field:"Science",era:"Modern",years:"1956–",arch:"Oracle",bio:"Physician, engineer, and astronaut who became the first Black woman to travel into space aboard the Space Shuttle Endeavour in 1992.",ach:["First Black woman in space (1992)","Physician and chemical engineer","Founded a science-education foundation"],built:"A path from medicine to orbit — the first Black woman in space, then a foundation for science education.",against:"An astronaut corps that had flown for twenty-two years without her.",cost:"Every child who looked up earlier and saw no one looking back.",learn:"https://en.wikipedia.org/wiki/Mae_Jemison"},
    {id:"bluford",name:"Guion Bluford",field:"Aerospace",era:"Modern",years:"1942–",arch:"Builder",bio:"Aerospace engineer and USAF pilot who became the first African American in space aboard the Space Shuttle Challenger in 1983.",ach:["First African American in space (1983)","Flew four Space Shuttle missions","PhD in aerospace engineering; decorated combat pilot"],built:"Four shuttle missions and the flight data of a decorated aerospace engineer.",against:"An Air Force and space program that promoted around its Black pilots.",cost:"The space age ran twenty years before it reflected the nation that funded it.",learn:"https://en.wikipedia.org/wiki/Guion_Bluford"}
  ];

  var TIMELINE = [
    {y:"1773",era:"Foundations",t:"The First Published Poet",d:"Phillis Wheatley becomes the first African American to publish a book of poetry, forcing colonial society to confront Black intellectual genius.",fig:"wheatley"},
    {y:"1791",era:"Foundations",t:"Surveying the Capital",d:"Benjamin Banneker assists in surveying the future Washington, D.C., and challenges Thomas Jefferson on the hypocrisy of slavery.",fig:"banneker"},
    {y:"1849",era:"Foundations",t:"The Underground Railroad",d:"Harriet Tubman escapes slavery and begins her missions south, ultimately guiding some 70 people to freedom.",fig:"tubman"},
    {y:"1865",era:"Foundations",t:"Juneteenth & Abolition",d:"On June 19, enslaved people in Texas learn of their freedom; the 13th Amendment abolishes slavery throughout the United States.",g:"return"},
    {y:"1872",era:"Resistance",t:"The Real McCoy",d:"Elijah McCoy patents an automatic lubricator for steam engines — one of 57 patents, and the likely origin of the phrase 'the real McCoy.'"},
    {y:"1881",era:"Resistance",t:"Tuskegee Rises",d:"Booker T. Washington founds Tuskegee Institute, building an engine of Black education in the Deep South.",fig:"washington"},
    {y:"1887",era:"Resistance",t:"The Black Edison",d:"Granville Woods patents the synchronous multiplex railway telegraph, enabling communication to and from moving trains.",fig:"woods"},
    {y:"1903",era:"Resistance",t:"The Souls of Black Folk",d:"W.E.B. Du Bois publishes his landmark work, reframing race, identity, and 'double consciousness' in America.",fig:"dubois"},
    {y:"1909",era:"Resistance",t:"The NAACP is Founded",d:"Ida B. Wells, W.E.B. Du Bois and others found the NAACP, launching the modern organized struggle for civil rights.",fig:"wells"},
    {y:"1915",era:"Resistance",t:"A Discipline is Born",d:"Carter G. Woodson founds the Association for the Study of Negro Life and History, formalizing the study of Black history.",fig:"woodson"},
    {y:"1921",era:"Renaissance",t:"Queen of the Skies",d:"Bessie Coleman earns her international pilot license in France — the first African American woman to do so.",fig:"coleman"},
    {y:"1921",era:"Renaissance",t:"Black Wall Street",d:"Tulsa's Greenwood District thrives as 'Black Wall Street,' a hub of Black prosperity — before it is destroyed in the 1921 Tulsa Race Massacre.",g:"bw"},
    {y:"1923",era:"Renaissance",t:"Genius on Every Corner",d:"Garrett Morgan patents his improved three-position traffic signal — a design ancestor of the modern stoplight.",fig:"morgan"},
    {y:"1926",era:"Renaissance",t:"The Month Begins",d:"Carter G. Woodson launches Negro History Week in February — the direct precursor to Black History Month.",fig:"woodson"},
    {y:"1936",era:"Renaissance",t:"Four Golds in Berlin",d:"Jesse Owens wins four gold medals at the Berlin Olympics, defying Nazi propaganda before the world."},
    {y:"1940",era:"CivilRights",t:"Banking the Nation's Blood",d:"Dr. Charles Drew's plasma research reshapes emergency medicine as he organizes large-scale blood banking.",fig:"drew"},
    {y:"1947",era:"CivilRights",t:"Breaking the Barrier",d:"Jackie Robinson debuts for the Brooklyn Dodgers, breaking Major League Baseball's color line."},
    {y:"1954",era:"CivilRights",t:"Separate is Not Equal",d:"Thurgood Marshall wins Brown v. Board of Education; the Supreme Court strikes down school segregation.",fig:"marshall",g:"return"},
    {y:"1955",era:"CivilRights",t:"The Boycott",d:"Rosa Parks' arrest sparks the Montgomery Bus Boycott, igniting the modern civil rights movement."},
    {y:"1962",era:"CivilRights",t:"Math for the Stars",d:"Katherine Johnson verifies the orbital math for John Glenn's spaceflight — he wouldn't fly until she checked it.",fig:"johnson"},
    {y:"1963",era:"CivilRights",t:"The Dream",d:"Dr. Martin Luther King Jr. delivers 'I Have a Dream' at the March on Washington before 250,000 people."},
    {y:"1964",era:"CivilRights",t:"The Law Changes",d:"The Civil Rights Act outlaws discrimination based on race, color, religion, sex, or national origin.",g:"return"},
    {y:"1965",era:"CivilRights",t:"The Right to Vote",d:"The Voting Rights Act outlaws the discriminatory practices that had disenfranchised Black voters for generations.",g:"return"},
    {y:"1968",era:"Modern",t:"Unbought & Unbossed",d:"Shirley Chisholm is elected the first Black woman in the U.S. Congress.",fig:"chisholm"},
    {y:"1976",era:"Modern",t:"A Nation Remembers",d:"Black History Month is officially recognized nationwide, expanding Woodson's week into a full month.",g:"return"},
    {y:"1983",era:"Modern",t:"Breaking Orbit",d:"Guion Bluford becomes the first African American in space aboard the Space Shuttle Challenger.",fig:"bluford"},
    {y:"1992",era:"Modern",t:"Reaching the Stars",d:"Dr. Mae Jemison becomes the first Black woman to travel into space aboard the Space Shuttle Endeavour.",fig:"jemison"},
    {y:"2008",era:"Modern",t:"The Highest Office",d:"Barack Obama is elected the first Black President of the United States.",g:"return"}
  ];

  var QUIZ = [
    {cat:"Letters",q:"Phillis Wheatley became the first African American to publish a book of what?",opts:["Sermons","Poetry","Essays","Music"],correct:1,fact:"Her 1773 collection was printed in London — a Boston panel had first interrogated her to 'prove' she wrote it."},
    {cat:"Liberation",q:"Harriet Tubman guided the Combahee River Raid, freeing roughly how many people in one night?",opts:["70","150","300","750"],correct:3,fact:"The 1863 raid made her the first woman in U.S. history to plan and lead an armed military operation."},
    {cat:"Liberation",q:"What nickname did Harriet Tubman earn on the Underground Railroad?",opts:["The Conductor","Moses","The General","North Star"],correct:1,fact:"Across roughly 13 missions she never lost a single passenger."},
    {cat:"Letters",q:"Frederick Douglass was the most ______ American of the 19th century.",opts:["photographed","wealthy","traveled","quoted"],correct:0,fact:"He sat for some 160 portraits, wielding the new medium of photography against racist caricature."},
    {cat:"Journalism",q:"Which newspaper did Frederick Douglass found in 1847?",opts:["The Liberator","The Crisis","The North Star","Freedom's Journal"],correct:2,fact:"Its masthead read: 'Right is of no Sex — Truth is of no Color.'"},
    {cat:"Journalism",q:"Ida B. Wells's investigative reporting exposed and documented what?",opts:["Election fraud","Lynching","Bank collapses","Prison labor"],correct:1,fact:"She published Southern Horrors in 1892 after a mob destroyed her Memphis press — and kept reporting."},
    {cat:"Law",q:"In 1884, Ida B. Wells refused to give up her train seat — then did what?",opts:["Fled to Chicago","Sued the railroad","Bought the railcar","Wrote to Congress"],correct:1,fact:"She won $500 at trial; the Tennessee Supreme Court overturned it, and she took up the pen instead."},
    {cat:"Institution",q:"Booker T. Washington built which institution from a one-room shanty?",opts:["Howard University","Fisk University","Tuskegee Institute","Morehouse College"],correct:2,fact:"His students fired the bricks and raised the buildings themselves — the campus was the curriculum."},
    {cat:"Politics",q:"In 1901, Booker T. Washington became the first African American to do what?",opts:["Address Congress","Dine at the White House","Run for Senate","Advise a president"],correct:1,fact:"Dinner with Theodore Roosevelt sparked such backlash that no Black guest was invited again for decades."},
    {cat:"Science",q:"George Washington Carver restored exhausted Southern soil by championing which crops?",opts:["Corn and wheat","Peanuts and sweet potatoes","Rice and indigo","Soy and cotton"],correct:1,fact:"He devised hundreds of uses for them and stunned Congress with his 1921 testimony."},
    {cat:"Invention",q:"Lewis Latimer's 1882 patent improved the lightbulb by perfecting what?",opts:["Glass vacuum seals","Carbon filaments","Copper wiring","Bulb sockets"],correct:1,fact:"His filament made electric light cheaper and longer-lasting; he also drafted Bell's telephone patent drawings."},
    {cat:"Politics",q:"Shirley Chisholm's famous 1972 campaign declaration was that she was what?",opts:["'Unbought and unbossed'","'First and fearless'","'The people's voice'","'Ready to lead'"],correct:0,fact:"First Black woman in Congress, then the first Black candidate to seek a major party's presidential nomination."},
    {cat:"Space",q:"Mae Jemison opened each shift aboard Endeavour with what phrase?",opts:["'All systems go'","'Godspeed'","'Hailing frequencies open'","'One small step'"],correct:2,fact:"A tribute to Star Trek's Lt. Uhura — Jemison later became the first real astronaut to appear on the show."},
    {cat:"Space",q:"Guion Bluford became the first African American in space aboard which shuttle?",opts:["Columbia","Discovery","Atlantis","Challenger"],correct:3,fact:"STS-8 launched at night in 1983; Bluford went on to fly four missions."},
    {cat:"Science",q:"Benjamin Banneker taught himself astronomy well enough to accurately predict what?",opts:["A comet's return","A solar eclipse","Halley's orbit","The transit of Venus"],correct:1,fact:"His 1789 eclipse forecast contradicted the leading almanac-makers of the day — and he was right."},
    {cat:"Space",q:"Katherine Johnson ran the trajectory calculations for which 1969 mission?",opts:["Apollo 8","Gemini 12","Apollo 11","Skylab"],correct:2,fact:"Her backup charts later helped bring Apollo 13 home."},
    {cat:"Business",q:"Villa Lewaro, Madam C.J. Walker's mansion, was designed by which pioneer?",opts:["Vertner Tandy","Paul Williams","Julian Abele","Norma Sklarek"],correct:0,fact:"Tandy was New York State's first licensed Black architect; Enrico Caruso named the estate."},
    {cat:"Scholarship",q:"W.E.B. Du Bois co-founded which organization in 1909?",opts:["The Urban League","The NAACP","SNCC","The Niagara Movement"],correct:1,fact:"He edited its magazine, The Crisis, for 24 years — required reading in Black households."},
    {cat:"Invention",q:"In 1916, Garrett Morgan used his safety hood invention to do what?",opts:["Fight a refinery fire","Rescue tunnel workers under Lake Erie","Survive a mine collapse","Test poison gas masks"],correct:1,fact:"After the rescue made news, sales dropped in the South once buyers learned the inventor was Black."},
    {cat:"Aviation",q:"Bessie Coleman refused to perform at airshows unless organizers did what?",opts:["Paid her double","Let all spectators use one gate","Grounded rival pilots","Flew the U.S. flag"],correct:1,fact:"No segregated entrances — her audiences walked in together or she didn't fly."},
    {cat:"Law",q:"Arguing before the Supreme Court, Thurgood Marshall won how many of his 32 cases?",opts:["17","21","29","32"],correct:2,fact:"He then became the Court's first Black justice in 1967."},
    {cat:"Invention",q:"Granville Woods's induction telegraphy allowed moving trains to do what?",opts:["Brake automatically","Talk to stations mid-journey","Switch tracks remotely","Run on electricity"],correct:1,fact:"It prevented collisions — and Woods twice beat Edison's patent challenges to keep it."},
    {cat:"Scholarship",q:"Carter G. Woodson set Negro History Week in February to honor which two birthdays?",opts:["Tubman and Truth","Lincoln and Douglass","Washington and Du Bois","Banneker and Wheatley"],correct:1,fact:"Lincoln on the 12th, Douglass on the 14th — communities had long celebrated both."},
    {cat:"Science",q:"Who helped survey Washington, D.C., and challenged Jefferson on slavery?",opts:["Benjamin Banneker","Frederick Douglass","Lewis Latimer","Charles Drew"],correct:0,fact:"Banneker, a self-taught astronomer, sent Jefferson his almanac with a famous 1791 letter."},
    {cat:"Invention",q:"Which invention is Garrett Morgan best known for improving?",opts:["The lightbulb","The three-position traffic signal","The telephone","The airplane"],correct:1,fact:"His 1923 signal added the 'caution' position — an ancestor of the modern stoplight."},
    {cat:"Space",q:"Which astronaut refused to fly until Katherine Johnson verified the math?",opts:["Neil Armstrong","Guion Bluford","John Glenn","Buzz Aldrin"],correct:2,fact:"Before his 1962 orbit, Glenn asked engineers to 'get the girl' to check the numbers by hand."},
    {cat:"Aviation",q:"Bessie Coleman traveled to which country to earn her pilot's license?",opts:["England","Canada","Germany","France"],correct:3,fact:"Barred from U.S. flight schools, she learned French and earned her license in France in 1921."},
    {cat:"Scholarship",q:"Carter G. Woodson is known as the Father of what?",opts:["Blood Banking","Black History","Civil Rights Law","Modern Journalism"],correct:1,fact:"He launched Negro History Week in 1926, which grew into Black History Month."},
    {cat:"Business",q:"Madam C.J. Walker built her fortune — a first for a self-made American woman — in what industry?",opts:["Real estate","Haircare products","Banking","Publishing"],correct:1,fact:"She built a nationwide sales force of Black women selling her haircare line."},
    {cat:"Law",q:"Thurgood Marshall argued which case that ended school segregation?",opts:["Plessy v. Ferguson","Loving v. Virginia","Brown v. Board of Education","Dred Scott"],correct:2,fact:"His 1954 win declared 'separate but equal' unconstitutional in schools."},
    {cat:"Medicine",q:"Dr. Charles Drew pioneered the large-scale banking of what?",opts:["Vaccines","Blood plasma","Antibiotics","Insulin"],correct:1,fact:"He later resisted the order to racially segregate donated blood — which has no scientific basis."},
    {cat:"Invention",q:"Granville Woods, a prolific inventor, was nicknamed the Black ______?",opts:["Franklin","Tesla","Edison","Newton"],correct:2,fact:"'The Black Edison' held roughly 60 patents, many for railway communication."},
    {cat:"Scholarship",q:"Who was the first African American to earn a PhD from Harvard?",opts:["Booker T. Washington","W.E.B. Du Bois","Frederick Douglass","Thurgood Marshall"],correct:1,fact:"Du Bois earned his Harvard PhD in 1895 and wrote 'The Souls of Black Folk.'"}
  ];

  var BONUS_Q = {cat:"Sealed File · Trial Nº 11",q:"Motown's Friday quality-control meeting judged every record against which question?",opts:["Would you buy this record for a dollar, or a sandwich?","Is it louder than anything on the radio?","Did it make the room dance?","Will it sell overseas?"],correct:0,fact:"Berry Gordy's test was hunger: a hit had to be worth the dollar you could have spent on lunch."};

  var CIPHERS = [
    {n:"GOLD LIGHT",m:"Preserved brilliance",svg:'<circle cx="22" cy="22" r="4.5" fill="#e8c070"/><g stroke="#e8c070" stroke-width="1.6" stroke-linecap="round"><line x1="31" y1="22" x2="39" y2="22"/><line x1="28.4" y1="28.4" x2="34" y2="34"/><line x1="22" y1="31" x2="22" y2="39"/><line x1="15.6" y1="28.4" x2="10" y2="34"/><line x1="13" y1="22" x2="5" y2="22"/><line x1="15.6" y1="15.6" x2="10" y2="10"/><line x1="22" y1="13" x2="22" y2="5"/><line x1="28.4" y1="15.6" x2="34" y2="10"/></g>'},
    {n:"RAILROADS",m:"Invisible infrastructure",svg:'<g fill="none" stroke="#e8c070" stroke-width="1.6" stroke-linecap="round"><line x1="14" y1="38" x2="20" y2="6"/><line x1="30" y1="38" x2="24" y2="6"/><line x1="15" y1="32" x2="29" y2="32"/><line x1="16.5" y1="24" x2="27.5" y2="24"/><line x1="18" y1="16" x2="26" y2="16"/><line x1="19" y1="9" x2="25" y2="9"/></g>'},
    {n:"BLUEPRINTS",m:"Hidden architecture",svg:'<g fill="none" stroke="#e8c070" stroke-width="1.6" stroke-linecap="round"><rect x="8" y="8" width="28" height="28" rx="2"/><line x1="8" y1="17" x2="36" y2="17" opacity=".55"/><line x1="17" y1="8" x2="17" y2="36" opacity=".55"/><path d="M22 22 h9 v9"/></g><circle cx="22" cy="22" r="1.8" fill="#e8c070"/>'},
    {n:"FIRE",m:"Destruction and transformation",svg:'<g fill="none" stroke="#e8c070" stroke-width="1.6" stroke-linecap="round"><path d="M22 6c3 6-5 9-3 15 1 4 4 5 4 9 0 3-2 6-5 6-5 0-8-4-8-9 0-3 1-5 2-7 0 3 1 4 3 5-2-6 3-10 7-19z"/><path d="M24 20c4 3 6 6 6 10 0 4-2 6-4 6" opacity=".7"/></g>'},
    {n:"STARS",m:"Navigation; future memory",svg:'<path d="M22 8l2.6 6.4 6.9.5-5.3 4.5 1.7 6.7-5.9-3.7-5.9 3.7 1.7-6.7-5.3-4.5 6.9-.5z" fill="none" stroke="#e8c070" stroke-width="1.6" stroke-linecap="round"/><circle cx="35" cy="10" r="1.3" fill="#e8c070"/><circle cx="9" cy="13" r="1" fill="#e8c070"/><circle cx="33" cy="33" r="1" fill="#e8c070"/>'},
    {n:"WATER",m:"The diaspora",svg:'<g fill="none" stroke="#e8c070" stroke-width="1.6" stroke-linecap="round"><path d="M8 17c4-4 8 4 12 0s8 4 12 0"/><path d="M8 25c4-4 8 4 12 0s8 4 12 0"/><path d="M8 33c4-4 8 4 12 0s8 4 12 0"/></g>'},
    {n:"TYPEWRITERS",m:"Erased authorship",svg:'<g fill="none" stroke="#e8c070" stroke-width="1.6" stroke-linecap="round"><rect x="9" y="20" width="26" height="12" rx="3"/><line x1="13" y1="14" x2="31" y2="14"/><line x1="16" y1="14" x2="16" y2="20"/><line x1="28" y1="14" x2="28" y2="20"/></g><circle cx="15" cy="26" r="1" fill="#e8c070"/><circle cx="20" cy="26" r="1" fill="#e8c070"/><circle cx="25" cy="26" r="1" fill="#e8c070"/><circle cx="30" cy="26" r="1" fill="#e8c070"/>'},
    {n:"DUST IN LIGHT",m:"Memory resurfacing",svg:'<path d="M10 8l20 28" stroke="#e8c070" stroke-width="6" opacity=".18"/><circle cx="16" cy="15" r="1.2" fill="#e8c070"/><circle cx="20" cy="21" r="1" fill="#e8c070"/><circle cx="24" cy="26" r="1.4" fill="#e8c070"/><circle cx="27" cy="31" r="1" fill="#e8c070"/><circle cx="14" cy="24" r=".9" fill="#e8c070" opacity=".7"/><circle cx="29" cy="18" r=".9" fill="#e8c070" opacity=".7"/>'},
    {n:"CRACKED MARBLE",m:"Edited history",svg:'<g fill="none" stroke="#e8c070" stroke-width="1.6" stroke-linecap="round"><rect x="13" y="10" width="18" height="4"/><rect x="15" y="14" width="14" height="18"/><rect x="12" y="32" width="20" height="4"/><path d="M22 14l-2.5 6 3.5 4-2 8"/></g>'},
    {n:"KEYS",m:"Doors locked, then opened",svg:'<g fill="none" stroke="#e8c070" stroke-width="1.6" stroke-linecap="round"><circle cx="16" cy="16" r="6.5"/><line x1="20.5" y1="20.5" x2="33" y2="33"/><line x1="29" y1="29" x2="25" y2="33"/><line x1="33" y1="33" x2="29" y2="37"/></g>'},
    {n:"HANDS",m:"What is passed on",svg:'<g fill="none" stroke="#e8c070" stroke-width="1.6" stroke-linecap="round"><path d="M8 26c5 1 8-3 12-3"/><path d="M8 30c6 1 10-3 13-4"/><path d="M36 18c-5-1-8 3-12 3"/><path d="M36 14c-6-1-10 3-13 4"/></g><circle cx="22" cy="22" r="2" fill="#e8c070"/>'}
  ];

  var CHAPTERS = [
    {n:"I",t:"The King Who Moved the Price of Gold"},
    {n:"II",t:"The Man Who Mailed the Proof"},
    {n:"III",t:"The Woman the Machine Answered To"},
    {n:"IV",t:"The Spy Who Freed 750 People in One Night"},
    {n:"V"},{n:"VI"},{n:"VII"},{n:"VIII"},{n:"IX"},{n:"X"},{n:"XI"},{n:"XII"}
  ];

  var FACTS = [
    "The traffic signal you obey daily was improved by Garrett Morgan, a Black inventor, in 1923.",
    "John Glenn wouldn't orbit Earth until Katherine Johnson checked the math by hand.",
    "Dr. Charles Drew built America's first large-scale blood banks — then resisted segregating the blood.",
    "Bessie Coleman learned French and crossed an ocean to earn a pilot's license America denied her.",
    "Carter G. Woodson created the week in 1926 that became Black History Month.",
    "Lewis Latimer's carbon filament is why the early lightbulb actually lasted.",
    "Granville Woods — 'the Black Edison' — held roughly 60 patents.",
    "Madam C.J. Walker ran a national sales force decades before 'network marketing' had a name."
  ];

  var ARCHDEF = {
    Builder: "Raises infrastructure where none was permitted to exist.",
    Keeper: "Guards and transmits the memory the record tried to drop.",
    Rebel: "Breaks the mechanism openly, and pays the toll first.",
    Oracle: "Sees what the age cannot, and calculates the path there.",
    Architect: "Designs the system beneath the system."
  };

  var ERAS = [["All","All Eras"],["Foundations","Foundations"],["Resistance","Resistance"],["Renaissance","Renaissance"],["CivilRights","Civil Rights"],["Modern","Modern & Future"]];
  var ACCENTS = [["#e8c070","#3a4048"],["#c9a84c","#30353c"],["#f2d391","#8a5a20"],["#d9b45f","#343a42"],["#e8c070","#30353c"]];
  var TOTAL_FRAGS = 16;

  function eraLabel(k) { var e = ERAS.filter(function (x) { return x[0] === k; })[0]; return e ? e[1] : k; }
  function initials(n) { return String(n).split(" ").filter(function (w) { return /[A-Za-z]/.test(w); }).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join(""); }
  function pad2(n) { return String(n).padStart(2, "0"); }
  function fmtDur(s) {
    if (s == null || s <= 0) return "";
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return h ? h + ":" + pad2(m) + ":" + pad2(sec) : m + ":" + pad2(sec);
  }
  function fmtWhen(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var days = Math.floor((Date.now() - d.getTime()) / 864e5);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return days + " days ago";
    if (days < 14) return "1 week ago";
    if (days < 60) return Math.floor(days / 7) + " weeks ago";
    return d.toLocaleDateString("en-US", {month: "short", year: "numeric"});
  }
  function keyOf(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function dayKey() { return keyOf(new Date()); }
  function yesterKey() { return keyOf(new Date(Date.now() - 864e5)); }
  function daySeed(k) { var h = 0; for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0; return h; }
  function drawQuiz(pool) {
    var a = pool.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a.slice(0, 10);
  }
  function reduced() { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }

  window.BGF_DATA = {
    YT: YT, SEED: SEED, FIGURES: FIGURES, TIMELINE: TIMELINE, QUIZ: QUIZ, BONUS_Q: BONUS_Q,
    CIPHERS: CIPHERS, CHAPTERS: CHAPTERS, FACTS: FACTS, ARCHDEF: ARCHDEF, ERAS: ERAS, ACCENTS: ACCENTS,
    TOTAL_FRAGS: TOTAL_FRAGS, eraLabel: eraLabel, initials: initials, pad2: pad2, fmtDur: fmtDur, fmtWhen: fmtWhen,
    keyOf: keyOf, dayKey: dayKey, yesterKey: yesterKey, daySeed: daySeed, drawQuiz: drawQuiz, reduced: reduced
  };
})();
