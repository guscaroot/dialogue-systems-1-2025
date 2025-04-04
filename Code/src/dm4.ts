import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure.ts";
import { DMContext, DMEvents } from "./types.ts";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint: "https://nlult2216.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview" /** your Azure CLU prediction URL */,
  key: NLU_KEY /** reference to your Azure CLU key */,
  deploymentName: "appointment" /** your Azure CLU deployment */,
  projectName: "appointment" /** your Azure CLU project name */,
};

const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials /** global activation of NLU */,
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisNeural",
};

interface info { info: string }
/* source used for information about celebrities: Wikipedia */
const celebrities: { [name: string]: info } = {
  beyoncé: { info: `Beyoncé Giselle Knowles-Carter, known as Beyoncé, was born September 4, 1981.
    She is an American singer, songwriter, actress and businesswoman. She has had a significant impact on the music industry and is known for her vocal ability, musical versatility, live performances, and culturally important works.`},
  rihanna: { info: `Robyn Rihanna Fenty, known as Rihanna, was born February 20, 1988.
    She is a Barbadian singer, businesswoman, and actress. Rihanna is one of the best-selling recording artists of all time, with sales estimated at 250 million units globally.` },
  "taylor swift": { info:`Taylor Alison Swift was born December 13, 1989. She is an American singer-songwriter. Known for her autobiographical songwriting, artistic versatility, and cultural impact, Swift is one of the world's best-selling music artists. She is also the highest-grossing touring artist, the richest female musician, and the first billionaire with music as the primary source of income.` },
  "jennifer lopez": {info: `Jennifer Lynn Lopez, also known as J.Lo, was born July 24, 1969.
    She is an American singer, songwriter, actress, dancer and businesswoman. Lopez is regarded as one of the most influential Latin entertainers of her time, credited with breaking barriers for Latino Americans in Hollywood and helping propel the Latin pop movement in music. She is also noted for her impact on popular culture through fashion, branding, and shifting mainstream beauty standards.`},
  "anne frank": {info: `Annelies Marie Frank was born 12 June 1929 and died February or March 1945.
    She was a German-born Jewish girl who kept a diary documenting her life in hiding amid Nazi persecution during the German occupation of the Netherlands. A celebrated diarist, Frank described everyday life from her family's hiding place in an Amsterdam attic. She gained fame posthumously and became one of the most-discussed Jewish victims of the Holocaust with the 1947 publication of The Diary of a Young Girl, which documents her life in hiding from 1942 to 1944. It is one of the world's best-known books and has been the basis for several plays and films.`},
  "marie curie": {info: `Maria Salomea Skłodowska-Curie was born 7 November 1867 and died 4 July 1934.
    She was a Polish and naturalised-French physicist and chemist who conducted pioneering research on radioactivity. She was the first woman to win a Nobel Prize, the first person to win a Nobel Prize twice, and the only person to win a Nobel Prize in two scientific fields. Her husband, Pierre Curie, was a co-winner of her first Nobel Prize, making them the first married couple to win the Nobel Prize and launching the Curie family legacy of five Nobel Prizes. She was, in 1906, the first woman to become a professor at the University of Paris.`},
  "frida kahlo": {info: `Magdalena Carmen Frida Kahlo y Calderón was born 6 July 1907 and died 13 July 1954.
    She was a Mexican painter known for her many portraits, self-portraits, and works inspired by the nature and artifacts of Mexico. Inspired by the country's popular culture, she employed a naïve folk art style to explore questions of identity, postcolonialism, gender, class, and race in Mexican society. Her paintings often had strong autobiographical elements and mixed realism with fantasy. In addition to belonging to the post-revolutionary Mexicayotl movement, which sought to define a Mexican identity, Kahlo has been described as a surrealist or magical realist. She is also known for painting about her experience of chronic pain.`},
  "margaret thatcher": {info: `Margaret Hilda Thatcher, Baroness Thatcher, was born 13 October 1925 an died 8 April 2013.
    She was a British stateswoman and Conservative politician who served as Prime Minister of the United Kingdom from 1979 to 1990 and Leader of the Conservative Party from 1975 to 1990. She was the longest-serving British prime minister of the 20th century and the first woman to hold the position. As prime minister, she implemented policies that came to be known as Thatcherism. A Soviet journalist dubbed her the "Iron Lady", a nickname that became associated with her uncompromising politics and leadership style.`},
  "gladys west": {info: `Gladys Mae West was born October 27, 1930.
    She is an American mathematician. She is known for her contributions to mathematical modeling of the shape of the Earth, and her work on the development of satellite geodesy models, that were later incorporated into the Global Positioning System (GPS). West was inducted into the United States Air Force Hall of Fame in 2018. West was awarded the Webby Lifetime Achievement Award for the development of satellite geodesy models.`},
  "jacinda ardern": {info: `Dame Jacinda Kate Laurell Ardern was born 26 July 1980.
    She is a former New Zealand politician, who served as the 40th prime minister of New Zealand and leader of the Labour Party from 2017 to 2023. She was a member of Parliament (MP) as a list MP from 2008 to 2017 and for Mount Albert from 2017 to 2023.`},
  "astrid lindgren": {info: `Astrid Anna Emilia Lindgren was born 14 November 1907 and died 28 January 2002.
    She was a Swedish writer of fiction and screenplays. She is best known for several children's book series and for the children's fantasy novels Mio, My Son; Ronia the Robber's Daughter; and The Brothers Lionheart. Lindgren wrote more than 30 books for children, and had by 2010 sold roughly 167 million books worldwide. In 1994, she was awarded the Right Livelihood Award for "her unique authorship dedicated to the rights of children and respect for their individuality". Her opposition to corporal punishment of children resulted in the world's first law on the matter in 1979, while her campaigning for animal welfare led to a new law, Lex Lindgren, in time for her 80th birthday.`},
  "coco chanel": {info: `Gabrielle Bonheur "Coco" Chanel was born 19 August 1883 and died 10 January 1971.
    She was a French fashion designer and businesswoman. The founder and namesake of the Chanel brand, she was credited in the post-World War I era with popularising a sporty, casual chic as the feminine standard of style. She is the only fashion designer listed on Time magazine's list of the 100 most influential people of the 20th century. A prolific fashion creator, Chanel extended her influence beyond couture clothing into jewellery, handbags, and fragrance. Her signature scent, Chanel No. 5, has become an iconic product, and Chanel herself designed her famed interlocked-CC monogram, which has been in use since the 1920s`},
};

function IntentWhoIsX(intent: string) {
  return intent == 'who is X'
}

function IntentMeeting(intent: string) {
  return intent == 'create a meeting'
}

function detectedPerson(entities: any) {
  return !!entities.find( (x: any) => x.category === "Person")
}

function getPerson(entities: any) {
  let obj_person = entities.find( (x: any)=> x.category === "Person")
  let index_person = entities.indexOf(obj_person)
  return entities[index_person].text.toLowerCase()
}

function isInCelebrities(utterance: string) {
  return (utterance.toLowerCase() in celebrities);
}

function giveInfoPerson(name: string) {
  return (celebrities[name.toLowerCase()] || {}).info
}

function detectedDay(entities: any) {
  return !!entities.find( (x: any) => x.category === "day")
}

function getDay(entities: any) {
  let obj_day = entities.find( (x: any)=> x.category === "day")
  let index_day = entities.indexOf(obj_day)
  return entities[index_day].text.toLowerCase()
}

function isWeekday(day: string) {
  return (day !== 'saturday' && day !== 'sunday')
}

function detectedYes(entities: any) {
  return !!entities.find( (x: any) => x.category === "yes")
}
  
function detectedNo(entities: any) {
  return !!entities.find( (x: any) => x.category === "no")
}

function detectedTime(entities: any) {
  return !!entities.find( (x: any) => x.category === "time")
}

function getTime(entities: any) {
  let obj_time = entities.find( (x: any)=> x.category === "time")
  let index_time = entities.indexOf(obj_time)
  return entities[index_time].text.toLowerCase()
}

const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
    "spst.speak": ({ context }, params: { utterance: string }) =>
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: params.utterance,
        },
      }),
    "spst.listen": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
      }),
      "spst.listen.nlu": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
        value: { nlu: true } /** Local activation of NLU */,
      }),
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    person_reply: null,
    day_reply: null,
    time_reply: null,
    yn: null,

  }),
  id: 'DM',
  initial: 'Main',
  states:{
    NoInput: {
      entry: {
        type: "spst.speak",
        params: { utterance: `I can't hear you!` },
      },
      on: { SPEAK_COMPLETE: "Main.hist" },
    },
    Main: {
      id: "Main",
      initial: "Prepare",
      states: {
        Prepare: {
          entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
          on: { ASRTTS_READY: "WaitToStart" },
        },
        WaitToStart: {
          on: { CLICK: "Greeting" },
        },
        hist: {
          type: 'history',
          history: 'deep'
        },
        Greeting: {
          initial: "Prompt",
          on: {
            LISTEN_COMPLETE: [ 
              { target: "CheckGreeting",
                guard: ({ context }) => !!context.lastResult,
              },
              { target: "#DM.NoInput" },
            ],
          },
          states: {
            /* hist: {
              type: 'history', 
            },*/
            Prompt: {
              entry: { type: "spst.speak", params: { utterance: `Hi, welcome to the voiced services!
                I can create an appointment for you, or give you some information about famous women.
                How can I help you?` } },
              on: { SPEAK_COMPLETE: "Ask" },
            },
            Ask: { 
              entry: { type: "spst.listen.nlu" },
              on: {
                RECOGNISED: [
                  { actions: assign(({ event }) => { 
                    return { lastResult: event.nluValue, person_reply: getPerson(event.nluValue.entities)}; }),
                    guard: (({ event }) =>  detectedPerson(event.nluValue.entities))                                             
                  },
                  { actions: assign(({ event }) => { 
                    return { lastResult: event.nluValue, person_reply: "notDetected"}; }),
                  }
                ],
                ASR_NOINPUT: { 
                  actions: assign({ lastResult: null }),
                },
              },
            },
          },
        },
        CheckGreeting: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({ 
              utterance: ` ${IntentWhoIsX(context.lastResult!.topIntent) || IntentMeeting(context.lastResult!.topIntent) ?
                "Ok" : "Sorry, I didn't understand. Do you want to book a meeting or get information about someone?" }`,}),
          },
          on: { SPEAK_COMPLETE: [
            { target: "WhoIsX.CheckCelebrity",
              guard: ({ context }) => (IntentWhoIsX(context.lastResult!.topIntent) && !!context.person_reply && context.person_reply !== 'notDetected'),
            },
            { target: "WhoIsX",
              guard: ({ context }) => (IntentWhoIsX(context.lastResult!.topIntent)),
            },
            { target: "CreateAMeeting.AskDay",
              guard: ({ context }) => (IntentMeeting(context.lastResult!.topIntent) && !!context.person_reply && context.person_reply !== 'notDetected'),
            },
            { target: "CreateAMeeting",
              guard: ({ context }) => (IntentMeeting(context.lastResult!.topIntent)),
            },
            { target: "Greeting.Ask" },
            ],
          },
        },
        WhoIsX: {
          id: "WhoIsX",
          initial: "Prompt",
          on: {
            LISTEN_COMPLETE: [ 
              { target: ".CheckCelebrity",
                guard: ({ context }) => !!context.person_reply,
              },
              { target: "#DM.NoInput" },                                       
            ],
          },
          states:{
            Prompt: {
              entry: {
                type: "spst.speak", params: { utterance: `Who do you want to get information about?`},
              },
              on: { SPEAK_COMPLETE: "Ask" },
            },
            Ask: {
              entry: { type: "spst.listen.nlu" },
              on: {
                RECOGNISED: [
                  { actions: assign(({ event }) => { 
                    return { lastResult: event.nluValue, person_reply: getPerson(event.nluValue.entities)}; }),
                    guard: (({ event }) =>  detectedPerson(event.nluValue.entities))                                             
                  },
                  { actions: assign({ person_reply: "notDetected" })}
                ],
                ASR_NOINPUT: { 
                  actions: assign({ person_reply: null }),
                },
              },
            },
            CheckCelebrity: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({ utterance: ` ${
                    isInCelebrities(context.person_reply!) || context.person_reply !== 'notDetected' ?
                    isInCelebrities(context.person_reply!) ?
                    "Let me see." : `I'm sorry but ${context.person_reply!} is not in my database` :
                    "Sorry, I didn't get the name."}`}),
              },
              on: {
                SPEAK_COMPLETE: [ 
                  { target: "Reply",
                    guard: ({ context }) => isInCelebrities(context.person_reply!),
                  },
                  { target: "Prompt" },
                ],
              },
            },
            Reply: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({ utterance: `${giveInfoPerson(context.person_reply!)}.

                  Thanks for choosing our services! Come back again if you need some more information or if you want to create an appointment.` }),
              },
              on: { SPEAK_COMPLETE: "#DM.Main.Done" }
            }
          },
        },
        CreateAMeeting: {
          id: "CreateAMeeting",
          initial: "AskPerson",
          states: {
            AskPerson: {
              initial: "Prompt",
              on: {
                LISTEN_COMPLETE: [ 
                  { target: "CheckPerson",
                    guard: ({ context }) => !!context.person_reply,
                  },
                  { target: "#DM.NoInput" },
                ],
              },
              states: {
                Prompt: {
                  entry: { type: "spst.speak", params: { utterance: `Who are you meeting with?` } },
                  on: { SPEAK_COMPLETE: "Ask" }, 
                },
                Ask: { 
                  entry: { type: "spst.listen.nlu" },
                  on: {
                    RECOGNISED: [
                      { actions: assign(({ event }) => { 
                        return { lastResult: event.nluValue, person_reply: getPerson(event.nluValue.entities)};}),
                        guard: (({ event }) =>  detectedPerson(event.nluValue.entities))                                             
                      },
                      { actions: assign({ person_reply: "notDetected" })}
                    ],
                  },
                  ASR_NOINPUT: { 
                    actions: assign({ person_reply: null }),
                  },
                },
              },
            },
            CheckPerson: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({ utterance: ` ${ context.person_reply !== 'notDetected' ?
                    `${context.person_reply!}. Well noted` : `Sorry, I didn't get the name.` }`}),
              },
              on: { 
                SPEAK_COMPLETE: [ 
                  { target: "AskDay",
                    guard: ({ context }) => context.person_reply !== 'notDetected',
                  },
                  { target: "AskPerson" },
                ],
              },
            },
            AskDay: {
              initial: "Prompt",
              on: {
                LISTEN_COMPLETE: [ 
                  { target: "CheckDay",
                    guard: ({ context }) => !!context.day_reply,
                  },
                  { target: "#DM.NoInput" },
                ],
              },
              states: {
                Prompt: {
                  entry: { type: "spst.speak", params: ({ context }) => ({utterance: `Which day do you want to meet with ${context.person_reply}?` }) },
                  on: { SPEAK_COMPLETE: "Ask" }, 
                },
                Ask: { 
                  entry: { type: "spst.listen.nlu" },
                  on: {
                    RECOGNISED: [
                      { actions: assign(({ event }) => { 
                          return { lastResult: event.nluValue, day_reply: getDay(event.nluValue.entities) }; }),
                        guard: (({ event }) =>  detectedDay(event.nluValue.entities))
                      },
                      { actions: assign({ day_reply: "notDetected" })}
                    ],
                    ASR_NOINPUT: { 
                      actions: assign({ day_reply: null }),
                    },
                  },
                },
              },
            },
            CheckDay: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({ utterance: ` ${ context.day_reply !== 'notDetected'?
                  context.day_reply !== 'notDetected' && isWeekday(context.day_reply!) ? `Right, on ${context.day_reply!} then.` :
                  "Unfortunately, you can only get an appointment on weekdays." : "Sorry, I didn't get the day." } `,}),
              },
              on: {
                SPEAK_COMPLETE: [ 
                  { target: "AskWholeDay",
                    guard: ({ context }) => context.day_reply !== 'notDetected' && isWeekday(context.day_reply!),
                  },
                  { target: "AskDay" },
                ]
              },
            },
            AskWholeDay: {
              initial: "Prompt",
              on: {
                LISTEN_COMPLETE: [ 
                  { target: "CheckWholeDay",
                    guard: ({ context }) => !!context.yn,
                  },
                  { target: "#DM.NoInput" },
                ],
              },
              states: {
                Prompt: {
                  entry: { type: "spst.speak", params: { utterance: `Will it take the whole day?` } },
                  on: { SPEAK_COMPLETE: "Ask" }, 
                },
                Ask: { 
                  entry: { type: "spst.listen.nlu" },
                  on: {
                    RECOGNISED: [
                      { actions: assign(({ event }) => { 
                          return { lastResult: event.nluValue, yn: 'yes' }; }),
                        guard: ({ event }) =>  detectedYes(event.nluValue.entities) && !detectedNo(event.nluValue.entities)
                      },
                      { actions: assign(({ event }) => { 
                          return { lastResult: event.value, yn: 'no' }; }),
                        guard: ({ event }) =>  detectedNo(event.nluValue.entities) && !detectedYes(event.nluValue.entities)
                      },
                      { actions: assign({ yn: 'notDetected' }),},
                    ],
                    ASR_NOINPUT: { 
                      actions: assign({ yn: null }),
                    },
                  },
                },
              },
            },
            CheckWholeDay: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({ utterance: ` ${ context.yn === 'yes' || context.yn === 'no' ?
                    "Ok" : `Sorry, I didn't understand. Please reply yes or no.` } `,}),
              },
              on: {
                SPEAK_COMPLETE: [ 
                  { target: "ConfirmWholeDay",
                    guard: ({ context }) => (context.yn === 'yes')
                  },
                  { target: "AskTime",
                    guard: ({ context }) => (context.yn === 'no')
                  },
                  { target: "AskWholeDay" },
                ]
              },
            },
            AskTime: {
              initial: "Prompt",
              on: {
                LISTEN_COMPLETE: [ 
                  { target: "CheckTime",
                    guard: ({ context }) => !!context.time_reply,
                  },
                  { target: "#DM.NoInput" },
                ],
              },
              states: {
                Prompt: {
                  entry: { type: "spst.speak", params: ({ context }) => ({ utterance: `What time do you want to meet on ${context.day_reply}?` }) },
                  on: { SPEAK_COMPLETE: "Ask" }, 
                },
                Ask: { 
                  entry: { type: "spst.listen.nlu" },
                  on: {
                    RECOGNISED: [ 
                      { actions: assign(({ event }) => { 
                          return { lastResult: event.nluValue, time_reply: getTime(event.nluValue.entities) }; }),
                        guard: (({ event }) =>  detectedTime(event.nluValue.entities))
                      },
                      { actions: assign({ time_reply: "notDetected" }) },
                    ],
                    ASR_NOINPUT: { 
                      actions: assign({ time_reply: null }),
                    },
                  },
                },
              },
            },
            CheckTime: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({ utterance: `${ context.time_reply !== 'notDetected' ?
                    `${context.time_reply!}. Understood.` : `Sorry, I didn't get the time.`}`,
                }),
              },
              on: {
                SPEAK_COMPLETE: [ 
                  { target: "ConfirmTime",
                    guard: ({ context }) => context.time_reply !== 'notDetected',
                  },
                  { target: "AskTime" },
                ]
              },
            },
            ConfirmWholeDay: {
              initial: "Prompt",
              on: {
                LISTEN_COMPLETE: [ 
                  { target: "CheckConfirmWholeDay",
                    guard: ({ context }) => !!context.yn,
                  },
                  { target: "#DM.NoInput" },
                ],
              },
              states: {
                Prompt: {
                  entry: { 
                    type: "spst.speak",
                    params: ({ context }) => ({ utterance: `Let's check now. Do you want me to create an appointment with ${
                      context.person_reply!} on ${context.day_reply!} for the whole day?`
                    })
                  },
                  on: { SPEAK_COMPLETE: "Ask" }, 
                },
                Ask: { 
                  entry: { type: "spst.listen.nlu" },
                  on: {
                    RECOGNISED: [
                      { actions: assign(({ event }) => { 
                          return { lastResult: event.nluValue, yn: 'yes' }; }),
                        guard: ({ event }) =>  detectedYes(event.nluValue.entities) && !detectedNo(event.nluValue.entities)
                      },
                      { actions: assign(({ event }) => { 
                          return { lastResult: event.value, yn: 'no' }; }),
                        guard: ({ event }) =>  detectedNo(event.nluValue.entities) && !detectedYes(event.nluValue.entities)
                      },
                      { actions: assign({ yn: 'notDetected' }),},
                    ],
                    ASR_NOINPUT: { 
                      actions: assign({ yn: null }),
                    },
                  },
                },
              },
            },
            CheckConfirmWholeDay: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({ utterance: ` ${ context.yn === 'yes' || context.yn === 'no' ? 
                    context.yn === 'yes' ? "Perfect!" : "Oh, sorry for the confusion." : 
                    `Sorry, I didn't understand your answer. Please reply yes or no.`} `,}),
              },
              on: { 
                SPEAK_COMPLETE: [ 
                  { target: "ConfirmAppointment",
                    guard: ({ context }) => context.yn === 'yes'
                  },
                  { target: "AskPerson",
                    guard: ({ context }) => context.yn === 'no' 
                  },
                  { target: "ConfirmWholeDay" },
                ]
              },
            },
            ConfirmTime: {
              initial: "Prompt",
              on: {
                LISTEN_COMPLETE: [ 
                  { target: "CheckConfirmTime",
                    guard: ({ context }) => !!context.yn,
                  },
                  { target: "#DM.NoInput" },
                ],
              },
              states: {
                Prompt: {
                  entry: { 
                    type: "spst.speak",
                    params: ({ context }) => ({ utterance: `Let's check now. Do you want me to create an appointment with ${
                      context.person_reply!} on ${context.day_reply} at ${context.time_reply}?`}),
                  },
                  on: { SPEAK_COMPLETE: "Ask" }, 
                },
                Ask: { 
                  entry: { type: "spst.listen.nlu" },
                  on: {
                    RECOGNISED: [
                      { actions: assign(({ event }) => { 
                          return { lastResult: event.nluValue, yn: 'yes' }; }),
                        guard: ({ event }) =>  detectedYes(event.nluValue.entities) && !detectedNo(event.nluValue.entities)
                      },
                      { actions: assign(({ event }) => { 
                          return { lastResult: event.value, yn: 'no' }; }),
                        guard: ({ event }) =>  detectedNo(event.nluValue.entities) && !detectedYes(event.nluValue.entities)
                      },
                      { actions: assign({ yn: 'notDetected' }),},
                    ],
                    ASR_NOINPUT: { 
                      actions: assign({ yn: null }),
                    },
                  },
                },
              },
            },
            CheckConfirmTime: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({ utterance: ` ${ context.yn === 'yes' || context.yn === 'no' ?
                    context.yn === 'yes' ? "Perfect!" : "Oh, sorry for the confusion." : 
                    `Sorry I didn't understand your answer. Please reply yes or no.` } `,}),
              },
              on: {
                SPEAK_COMPLETE: [ 
                  { target: "ConfirmAppointment",
                    guard: ({ context }) => context.yn === 'yes'
                  },
                  { target: "AskPerson",
                    guard: ({ context }) => context.yn === 'no'
                  },
                  { target: "ConfirmTime" },
                ]
              },
            },
            ConfirmAppointment: {
              entry: { type: "spst.speak", params: { utterance: `Your appointment has been created! Thanks for choosing our services!` }
              },
              on: { SPEAK_COMPLETE: "#DM.Main.Done" }, 
            },
          },
        },
        Done: {
          on: {
            CLICK: "#DM.Main.Greeting",
          },
        },
      },
    },
  },
})

const dmActor = createActor(dmMachine, {
  inspect: inspector.inspect,
}).start();

dmActor.subscribe((state) => {
  console.group("State update");
  console.log("State value:", state.value);
  console.log("State context:", state.context);
  console.groupEnd();
});

export function setupButton(element: HTMLButtonElement) {
  element.addEventListener("click", () => {
    dmActor.send({ type: "CLICK" });
  });
  dmActor.subscribe((snapshot) => {
    const meta: { view?: string } = Object.values(
      snapshot.context.spstRef.getSnapshot().getMeta(),
    )[0] || {
      view: undefined,
    };
    element.innerHTML = `${meta.view}`;
  });
}
