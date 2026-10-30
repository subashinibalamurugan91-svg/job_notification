"""
generate_sample_references.py
Generates 12 high-quality, multi-page placement reference PDFs for the Campus Recruitment System.
Saves them into s:/job_notification/uploads/references/
"""

import os
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.patches as patches

OUTPUT_DIR = "s:/job_notification/uploads/references"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Define reference documents metadata and content
DOCUMENTS = [
    {
        "file_name": "Aptitude Questions.pdf",
        "title": "Aptitude Questions & Solved Problems",
        "category": "Aptitude",
        "uploaded_by": "TPO Quantitative Cell",
        "description": "Comprehensive practice question bank covering percentages, time & work, ratio & proportion, and number systems with step-by-step solutions.",
        "pages": [
            {
                "subtitle": "Comprehensive Question Bank: Quantitative Aptitude",
                "sections": [
                    ("1. Number System & Simplification", [
                        "• Rule of BODMAS: Brackets -> Order -> Division -> Multiplication -> Addition -> Subtraction.",
                        "• Problem 1: Find the value of 1800 ÷ [10{(12-6) + (24-12)}].",
                        "  Solution: Inside innermost brackets: 12-6=6, 24-12=12. Sum=18. 10*18=180. 1800 ÷ 180 = 10.",
                        "• Problem 2: If a number is divided by 136, it leaves 36 as remainder. What is the remainder when divided by 17?",
                        "  Solution: 136 is divisible by 17 (17*8 = 136). Remainder = 36 mod 17 = 2."
                    ]),
                    ("2. Percentage & Profit/Loss", [
                        "• Percentage Increase = (Increase / Original) * 100.",
                        "• Problem: In an exam 65% of students passed and 420 failed. What is the total strength?",
                        "  Solution: Failed percentage = 35%. 0.35 * Total = 420 => Total = 420 / 0.35 = 1,200 students.",
                        "• Problem: Selling an article at Rs. 990 yields 10% loss. What selling price gives 10% profit?",
                        "  Solution: Cost Price = 990 / 0.9 = Rs. 1,100. Target SP = 1,100 * 1.10 = Rs. 1,210."
                    ])
                ]
            },
            {
                "subtitle": "Time, Work, Pipes & Cisterns",
                "sections": [
                    ("3. Time & Work Core Equations", [
                        "• Work done per day by person A taking 'a' days = 1/a.",
                        "• Combined work rate: If A takes 10 days and B takes 15 days, 1/Total = 1/10 + 1/15 = 5/30 = 1/6.",
                        "  Total combined time = 6 days.",
                        "• Efficiency principle: If Tanya is 25% more efficient than Sakshi (20 days):",
                        "  Efficiency ratio = 1.25 : 1 => Time taken by Tanya = 20 / 1.25 = 16 days."
                    ]),
                    ("4. Speed, Distance & Relative Motion", [
                        "• Conversion factor: km/hr to m/s = Multiply by 5/18.",
                        "• Problem: A train 150m long moving at 60 km/h crosses a 300m platform.",
                        "  Total distance = 150 + 300 = 450m. Speed = 60 * (5/18) = 50/3 m/s.",
                        "  Time required = Distance / Speed = 450 / (50/3) = 27 seconds."
                    ])
                ]
            }
        ]
    },
    {
        "file_name": "Quantitative Aptitude Guide.pdf",
        "title": "Quantitative Aptitude Guide & Formula Sheet",
        "category": "Aptitude",
        "uploaded_by": "Senior Mathematics Faculty",
        "description": "Quick reference handbook containing arithmetic formulas, algebra identities, logarithms, geometry theorems, and probability rules.",
        "pages": [
            {
                "subtitle": "Formula Handbook & High-Yield Shortcuts",
                "sections": [
                    ("1. Arithmetic & Progression (AP & GP)", [
                        "• AP nth term: Tn = a + (n - 1)d; Sum of n terms: Sn = n/2 [2a + (n - 1)d].",
                        "• GP nth term: Tn = a * r^(n - 1); Sum of n terms: Sn = a(r^n - 1)/(r - 1) for r > 1.",
                        "• Infinite GP sum: S_inf = a / (1 - r), where |r| < 1.",
                        "• Harmonic Mean (HM) = 2ab / (a + b) for two numbers a and b."
                    ]),
                    ("2. Algebra & Logarithms", [
                        "• (a + b + c)^2 = a^2 + b^2 + c^2 + 2(ab + bc + ca).",
                        "• a^3 + b^3 + c^3 - 3abc = (a + b + c)(a^2 + b^2 + c^2 - ab - bc - ca).",
                        "• If a + b + c = 0, then a^3 + b^3 + c^3 = 3abc.",
                        "• log_b(x * y) = log_b(x) + log_b(y); log_b(x / y) = log_b(x) - log_b(y); log_b(x^k) = k * log_b(x)."
                    ])
                ]
            },
            {
                "subtitle": "Geometry, Mensuration & Probability",
                "sections": [
                    ("3. Mensuration 2D & 3D Cheat Sheet", [
                        "• Circle Area = π * r^2; Circumference = 2π * r; Sector Area = (θ / 360) * π * r^2.",
                        "• Cylinder Volume = π * r^2 * h; Curved Surface Area = 2π * r * h; Total Surface = 2πr(r + h).",
                        "• Cone Volume = (1/3) * π * r^2 * h; Slant height l = sqrt(r^2 + h^2).",
                        "• Sphere Volume = (4/3) * π * r^3; Surface Area = 4π * r^2."
                    ]),
                    ("4. Probability & Combinatorics", [
                        "• Permutation: nPr = n! / (n - r)! (Arrangement matters).",
                        "• Combination: nCr = n! / (r! * (n - r)!) (Selection without ordering).",
                        "• Probability P(E) = n(E) / n(S); P(A U B) = P(A) + P(B) - P(A ∩ B)."
                    ])
                ]
            }
        ]
    },
    {
        "file_name": "Logical Reasoning Practice.pdf",
        "title": "Logical Reasoning Practice & Puzzles",
        "category": "Aptitude",
        "uploaded_by": "Campus Reasoning Trainer",
        "description": "Standard logical reasoning puzzles covering seating arrangement, syllogisms, blood relations, and coding-decoding patterns.",
        "pages": [
            {
                "subtitle": "Seating Arrangements & Direction Sense",
                "sections": [
                    ("1. Seating Arrangement Strategies", [
                        "• Linear Arrangements: Pay close attention to facing North vs. South.",
                        "• Circular Arrangements: Facing Center -> Clockwise is Left, Counter-Clockwise is Right.",
                        "• Facing Outward -> Clockwise is Right, Counter-Clockwise is Left.",
                        "• Always begin with definitive clues (e.g. 'P sits at the extreme left end')."
                    ]),
                    ("2. Direction Sense Test Essentials", [
                        "• Standard 4 cardinal directions (N, S, E, W) and 4 intermediate (NE, NW, SE, SW).",
                        "• Shadow at Sunrise: Shadow falls towards West.",
                        "• Shadow at Sunset: Shadow falls towards East. At 12 Noon, no shadow is cast directly.",
                        "• Use Pythagoras Theorem (a^2 + b^2 = c^2) to calculate shortest displacement."
                    ])
                ]
            },
            {
                "subtitle": "Syllogisms & Analytical Deductions",
                "sections": [
                    ("3. Syllogism Venn Diagram Rules", [
                        "• All A are B: Circle A is completely inside Circle B.",
                        "• Some A are B: Overlapping region exists between A and B.",
                        "• No A is B: Disjoint circles with no intersection.",
                        "• Either-Or Complementary Pairs: (Some + No) or (All + Some Not)."
                    ]),
                    ("4. Blood Relations & Coded Hierarchy", [
                        "• Representation: Male denoted by (+), Female denoted by (-), Married couple (=), Siblings (-).",
                        "• Generational hierarchy: Place grandparents at top tier, parents in middle, children at base.",
                        "• Coded Relations: Decode from right to left to establish immediate relationships."
                    ])
                ]
            }
        ]
    },
    {
        "file_name": "Technical Interview Questions.pdf",
        "title": "Technical Interview Questions (Core CS)",
        "category": "Technical",
        "uploaded_by": "Technical Placement Board",
        "description": "Core computer science interview guide spanning Operating Systems, DBMS, Computer Networks, and System Design.",
        "pages": [
            {
                "subtitle": "Operating Systems & Database Management",
                "sections": [
                    ("1. Operating Systems High-Yield Topics", [
                        "• Process vs. Thread: Process is an execution program with dedicated address space; Thread is a lightweight sub-unit sharing process memory.",
                        "• Deadlock Conditions: Mutual exclusion, Hold & wait, No preemption, Circular wait.",
                        "• Virtual Memory & Paging: Eliminates external fragmentation; Page replacement algorithms: FIFO, LRU, LFU.",
                        "• Context Switching: Overhead of saving state of currently running process and restoring next scheduled process."
                    ]),
                    ("2. DBMS & SQL Query Architecture", [
                        "• ACID Properties: Atomicity (all or nothing), Consistency, Isolation, Durability.",
                        "• Normalization: 1NF (atomic values), 2NF (no partial dependency), 3NF (no transitive dependency), BCNF.",
                        "• Clustered vs. Non-Clustered Index: Clustered alters physical row storage order (one per table); Non-clustered creates index table with row pointers.",
                        "• Transactions & Locking: Shared locks (read-only) vs. Exclusive locks (write access)."
                    ])
                ]
            },
            {
                "subtitle": "Computer Networks & System Design Principles",
                "sections": [
                    ("3. Computer Networks (OSI & TCP/IP)", [
                        "• OSI 7 Layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.",
                        "• TCP vs. UDP: TCP is connection-oriented, reliable, with flow & congestion control. UDP is stateless, lightweight, low-latency.",
                        "• DNS Resolution: Browser cache -> OS cache -> Router cache -> ISP DNS Resolver -> Root/TLD servers.",
                        "• HTTPS & TLS Handshake: Symmetric key encryption negotiated via asymmetric RSA/ECC key exchange."
                    ]),
                    ("4. System Design Basics for Freshers", [
                        "• Horizontal Scaling vs. Vertical Scaling: Adding more servers vs. upgrading CPU/RAM of a single machine.",
                        "• Load Balancing: Distributes traffic (Round Robin, Least Connections, IP Hash).",
                        "• Caching Strategies: Write-Through, Write-Back, Cache-Aside using Redis / Memcached.",
                        "• CAP Theorem: A distributed system can guarantee at most 2 out of 3: Consistency, Availability, Partition Tolerance."
                    ])
                ]
            }
        ]
    },
    {
        "file_name": "Data Structures Notes.pdf",
        "title": "Data Structures Notes & Algorithm Patterns",
        "category": "Technical",
        "uploaded_by": "Competitive Programming Lead",
        "description": "Detailed notes on Linear and Non-Linear Data Structures, Tree traversals, Graph algorithms, Dynamic Programming, and Big-O complexity.",
        "pages": [
            {
                "subtitle": "Linear Data Structures & Sorting Complexity",
                "sections": [
                    ("1. Complexity Analysis & Big-O Notation", [
                        "• Array Access: O(1) time; Insertion/Deletion: O(n) worst-case due to element shifting.",
                        "• Linked List: Singly vs. Doubly vs. Circular; Insertion at head O(1), Search O(n).",
                        "• Stack (LIFO): push, pop, peek O(1); Applications: Expression parsing, backtracking.",
                        "• Queue (FIFO): enqueue, dequeue O(1); Variations: Circular Queue, PriorityQueue (Heap-backed)."
                    ]),
                    ("2. Sorting & Searching Comparison Table", [
                        "• QuickSort: Best O(n log n), Worst O(n^2), Space O(log n) recursive stack. In-place, unstable.",
                        "• MergeSort: Guaranteed O(n log n) in all cases, Space O(n). Stable, suitable for linked lists.",
                        "• HeapSort: Guaranteed O(n log n), Space O(1). In-place, unstable.",
                        "• Binary Search: O(log n) time on sorted collection; Two-pointer and sliding window patterns."
                    ])
                ]
            },
            {
                "subtitle": "Non-Linear Structures & Graph Traversals",
                "sections": [
                    ("3. Trees & Binary Search Trees (BST)", [
                        "• Traversals: In-order (Left, Root, Right -> Sorted for BST), Pre-order (Root, L, R), Post-order (L, R, Root).",
                        "• Balanced Trees: AVL and Red-Black Trees guarantee O(log n) search/insertion/deletion.",
                        "• Trie (Prefix Tree): Optimal for autocomplete, prefix search, and dictionary word lookup."
                    ]),
                    ("4. Graphs & Dynamic Programming", [
                        "• Graph Representations: Adjacency Matrix O(V^2) space vs. Adjacency List O(V + E) space.",
                        "• Traversals: BFS uses Queue (Shortest path in unweighted graphs); DFS uses Stack/Recursion.",
                        "• Shortest Path: Dijkstra's Algorithm O((V + E) log V) with Min-Heap; Bellman-Ford for negative weights.",
                        "• Dynamic Programming: Optimal Substructure + Overlapping Subproblems (Memoization vs. Tabulation)."
                    ])
                ]
            }
        ]
    },
    {
        "file_name": "Java Interview Questions.pdf",
        "title": "Java Interview Questions & Concepts",
        "category": "Programming",
        "uploaded_by": "Enterprise Systems Architect",
        "description": "Top Java interview questions covering OOP, Collections Framework, Multithreading, JVM Architecture, and modern Java 8+ features.",
        "pages": [
            {
                "subtitle": "Core Java, OOP & Memory Architecture",
                "sections": [
                    ("1. Object-Oriented Principles in Java", [
                        "• Encapsulation: Restricting direct access to object fields using private access and public getters/setters.",
                        "• Inheritance: Code reusability via 'extends'; Java supports single class inheritance, multiple interface inheritance.",
                        "• Polymorphism: Compile-time (Method Overloading) vs. Runtime (Method Overriding with dynamic dispatch).",
                        "• Abstraction: Abstract classes (can have state/constructors) vs. Interfaces (pure contract, default methods since Java 8)."
                    ]),
                    ("2. JVM Internals & Memory Model", [
                        "• JVM Components: ClassLoader Subsystem, Runtime Data Areas, Execution Engine (JIT Compiler & Garbage Collector).",
                        "• Memory Areas: Heap (shared, objects live here, Eden/Survivor/Tenured) vs. Stack (per-thread, frames, local primitives).",
                        "• Garbage Collection: Mark-and-Sweep, G1GC, ZGC. 'System.gc()' merely suggests collection to the JVM.",
                        "• String Pool: String immutability enables caching in PermGen/Metaspace String Constant Pool."
                    ])
                ]
            },
            {
                "subtitle": "Collections, Concurrency & Modern Java",
                "sections": [
                    ("3. Collections Framework Deep Dive", [
                        "• List: ArrayList (dynamic array, fast random access) vs. LinkedList (node pointers, fast insertion at ends).",
                        "• Set: HashSet (backed by HashMap, O(1) average lookup) vs. TreeSet (Navigable, sorted by Red-Black Tree, O(log n)).",
                        "• Map: HashMap internal working: Array of buckets, hash collision handled via LinkedList/Treeify threshold of 8.",
                        "• ConcurrentHashMap: Thread-safe without synchronizing entire table (Segment/bucket level locking)."
                    ]),
                    ("4. Multi-Threading & Java 8+ Features", [
                        "• Creating Threads: Extending Thread class vs. Implementing Runnable/Callable interface.",
                        "• Thread States: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED.",
                        "• Functional Interfaces: SAM (Single Abstract Method) annotated with @FunctionalInterface (Predicate, Function, Consumer, Supplier).",
                        "• Stream API: Declarative pipelines: filter(), map(), flatMap(), reduce(), collect(). Lazy evaluation via terminal operations."
                    ])
                ]
            }
        ]
    },
    {
        "file_name": "Python Interview Questions.pdf",
        "title": "Python Interview Questions & Coding Tips",
        "category": "Programming",
        "uploaded_by": "Data Science & AI Mentor",
        "description": "Essential Python interview preparation guide covering language internals, memory management, decorators, generators, and data structures.",
        "pages": [
            {
                "subtitle": "Python Fundamentals, Memory & Language Internals",
                "sections": [
                    ("1. Python Data Model & Mutability", [
                        "• Mutable Types: list, dict, set, bytearray (modified in-place).",
                        "• Immutable Types: int, float, bool, str, tuple, frozenset (creates new object upon modification).",
                        "• Memory Management: Reference counting combined with generational cyclic garbage collector.",
                        "• Shallow vs. Deep Copy: 'copy.copy()' copies container pointers; 'copy.deepcopy()' recursively clones all nested objects."
                    ]),
                    ("2. Global Interpreter Lock (GIL) & Concurrency", [
                        "• What is GIL? A mutex that prevents multiple native threads from executing Python bytecode simultaneously.",
                        "• CPU-bound tasks: Use 'multiprocessing' module to bypass the GIL by spawning independent OS processes.",
                        "• I/O-bound tasks: Use 'threading' or 'asyncio' (coroutines with event loop) for asynchronous non-blocking performance.",
                        "• 'with' Statement: Context Managers implementing '__enter__' and '__exit__' for safe resource allocation."
                    ])
                ]
            },
            {
                "subtitle": "Advanced Python Constructs & Best Practices",
                "sections": [
                    ("3. Decorators, Generators & Comprehensions", [
                        "• Decorator: A callable that wraps another function to augment behavior without modifying source code.",
                        "• Generator: Functions yielding values lazily using 'yield' keyword; conserves memory for large data pipelines.",
                        "• List & Dict Comprehensions: [x**2 for x in range(10) if x % 2 == 0] (faster than manual loops).",
                        "• *args and **kwargs: Variable positional arguments (tuple) and keyword arguments (dictionary)."
                    ]),
                    ("4. Object-Oriented Python & Magic Methods", [
                        "• Magic (Dunder) Methods: '__init__' (initializer), '__str__' (user readable), '__repr__' (unambiguous code representation).",
                        "• Method Resolution Order (MRO): C3 Linearization algorithm for multiple inheritance; inspect via 'Class.__mro__'.",
                        "• '@property' decorator: Pythonic encapsulation to provide managed getter and setter attributes.",
                        "• Popular Libraries Overview: NumPy (vectorized arrays), Pandas (DataFrames), Scikit-Learn (ML pipelines)."
                    ])
                ]
            }
        ]
    },
    {
        "file_name": "Resume Writing Guide.pdf",
        "title": "Resume Writing Guide & ATS Blueprint",
        "category": "Resume",
        "uploaded_by": "Career Development Cell",
        "description": "Step-by-step master guide for engineering students to build clean, high-impact, ATS-friendly resumes for top recruiters.",
        "pages": [
            {
                "subtitle": "Anatomy of an ATS-Compliant Tech Resume",
                "sections": [
                    ("1. ATS (Applicant Tracking System) Fundamentals", [
                        "• Avoid complex graphics, tables, dual columns, text boxes, and icons that confuse parsing algorithms.",
                        "• Standard Margins & Typography: 0.5 - 0.75 inch margins; clean fonts like Inter, Arial, Calibri (10-11pt).",
                        "• File Format: Single-page PDF named cleanly: 'FirstName_LastName_Resume.pdf'.",
                        "• Keyword Optimization: Mirror essential tech skills directly from job descriptions."
                    ]),
                    ("2. Strategic Section Structure", [
                        "• Contact Header: Full Name, Professional Email, Phone Number, LinkedIn URL, GitHub Profile URL, Location.",
                        "• Education: Degree, Major, University, CGPA (especially if >= 7.5), Year of Graduation.",
                        "• Technical Skills: Categorized into Languages, Frameworks, Databases, Tools/Platforms.",
                        "• Experience / Internships: Reverse chronological order with metrics-driven bullet points."
                    ])
                ]
            },
            {
                "subtitle": "High-Impact Bullet Points & Project Showcases",
                "sections": [
                    ("3. The Google XYZ Formula for Bullet Points", [
                        "• Formula: 'Accomplished [X] as measured by [Y], by doing [Z]'.",
                        "• Weak: 'Built a web application for campus placements.'",
                        "• Strong: 'Developed a responsive placement tracking portal used by 1,200+ students, reducing application processing time by 45% using Spring Boot and React.'",
                        "• Strong Action Verbs: Engineered, Architected, Spearheaded, Accelerated, Optimized, Automated."
                    ]),
                    ("4. Common Resume Red Flags to Avoid", [
                        "• Vague generic summaries ('Hardworking student seeking entry level job...').",
                        "• Rating skills with arbitrary star bars (e.g. 4/5 stars in Java).",
                        "• Unverified claims or projects with broken/empty GitHub repositories.",
                        "• Spelling and grammatical mistakes — always peer-review before upload."
                    ])
                ]
            }
        ]
    },
    {
        "file_name": "Group Discussion Tips.pdf",
        "title": "Group Discussion Tips & Frameworks",
        "category": "Group Discussion",
        "uploaded_by": "Soft Skills Training Division",
        "description": "Proven frameworks, opening/closing strategies, etiquette, and tactics to excel in placement group discussion rounds.",
        "pages": [
            {
                "subtitle": "Frameworks, Etiquette & Discussion Dynamics",
                "sections": [
                    ("1. What Evaluators Look For in a GD", [
                        "• Content & Subject Knowledge: Fact-based arguments over emotional rhetoric.",
                        "• Communication Clarity: Articulate delivery, moderate pace, and active listening.",
                        "• Leadership & Team Spirit: Facilitating quieter participants and moving the group toward consensus.",
                        "• Emotional Stability: Maintaining composure and diplomacy when challenged."
                    ]),
                    ("2. Structured Thinking Frameworks", [
                        "• PESTLE Framework: Political, Economic, Social, Technological, Legal, Environmental dimensions.",
                        "• 360-Degree Perspective: Individual -> Society -> National -> Global viewpoint.",
                        "• Pros & Cons Matrix: Acknowledge valid counter-arguments before defending your thesis.",
                        "• Stakeholder Analysis: Examine impacts on consumers, businesses, government, and marginalized communities."
                    ])
                ]
            },
            {
                "subtitle": "Opening, Steering & Handling Common Scenarios",
                "sections": [
                    ("3. Initiation & Conclusion Strategies", [
                        "• Initiating the GD: Only initiate if you understand the topic thoroughly; provide a clear definition and scope.",
                        "• Example Opener: 'Good morning everyone. Today we are deliberating on... I would like to outline three key dimensions...'",
                        "• Summarizing: A summary must remain unbiased, capturing all viewpoints, not just your personal stance."
                    ]),
                    ("4. Navigating Difficult GD Situations", [
                        "• The Fish Market Scenario: Remain calm; wait for a momentary lull, raise your hand politely, and say: 'Friends, let us ensure everyone gets an opportunity to share their thoughts.'",
                        "• If you lack knowledge on an abstract topic: Listen actively to the first 2 speakers, extract key themes, and expand on them thoughtfully.",
                        "• Body Language: Sit upright, make eye contact with all participants (never the moderator), and nod encouragingly."
                    ])
                ]
            }
        ]
    },
    {
        "file_name": "HR Interview Questions.pdf",
        "title": "HR Interview Questions & Winning Answers",
        "category": "HR Interview",
        "uploaded_by": "Senior HR Placement Consultant",
        "description": "Comprehensive guide to behavioral and HR interview rounds featuring the STAR method, common pitfalls, and sample answer structures.",
        "pages": [
            {
                "subtitle": "Behavioral Questions & The STAR Method",
                "sections": [
                    ("1. Mastering the STAR Technique", [
                        "• Situation: Set the context and background (Where, When, Who).",
                        "• Task: Explain the specific challenge or objective you were responsible for.",
                        "• Action: Detail the precise actions YOU took, technologies chosen, and steps executed.",
                        "• Result: Quantify the positive outcome, key learnings, and measurable business impact."
                    ]),
                    ("2. High-Frequency Questions & Frameworks", [
                        "• 'Tell me about yourself': Present -> Past -> Future structure in 90 seconds (Current degree/focus, key academic achievements, why this company).",
                        "• 'What are your strengths?': Highlight 2-3 traits backed by tangible proof points (e.g. analytical problem-solving with hackathon win).",
                        "• 'What is your greatest weakness?': Mention a real professional area of growth and describe active steps you are taking to overcome it."
                    ])
                ]
            },
            {
                "subtitle": "Situational Responses & Interview Closure",
                "sections": [
                    ("3. Handling Tough & Tricky Questions", [
                        "• 'Why should we hire you?': Connect your technical skill set with the company's culture and specific role demands.",
                        "• 'Where do you see yourself in 5 years?': Express ambition for progressive technical mastery and leadership contribution within the organization.",
                        "• 'Why our company?': Demonstrate genuine research on company products, recent milestones, and corporate values."
                    ]),
                    ("4. Intelligent Questions to Ask the Interviewer", [
                        "• 'What does a typical onboarding trajectory look like for a graduate engineer in this team?'",
                        "• 'What are the biggest technical challenges the engineering group is currently tackling?'",
                        "• 'How does the company support continuous professional development and mentorship?'"
                    ])
                ]
            }
        ]
    },
    {
        "file_name": "Placement Preparation Blueprint.pdf",
        "title": "Campus Placement Preparation Blueprint",
        "category": "Placement Preparation",
        "uploaded_by": "Dean of Training & Placement",
        "description": "Comprehensive 4-phase preparation roadmap covering timeline, coding milestones, aptitude strategy, and mock interview schedule.",
        "pages": [
            {
                "subtitle": "Four-Phase Preparation Roadmap & Milestones",
                "sections": [
                    ("Phase 1: Foundation (Months 1-2)", [
                        "• Master one object-oriented language deeply (Java or C++ or Python).",
                        "• Study core data structures: Arrays, Strings, Linked Lists, Stacks, Queues.",
                        "• Complete daily practice of 2 aptitude topics: Number systems, Percentages, Ratios.",
                        "• Draft initial ATS-friendly resume."
                    ]),
                    ("Phase 2: Core CS & Problem Solving (Months 3-4)", [
                        "• Non-linear data structures: Trees (BST, Traversals), Heaps, Graphs (BFS/DFS).",
                        "• Revise Core CS subjects: OS (Process scheduling, Memory), DBMS (SQL, Normalization), CN.",
                        "• Solve 100+ LeetCode problems (Easy to Medium) across Sliding Window, Two Pointers, and Binary Search.",
                        "• Build 2 robust full-stack or domain-specific portfolio projects."
                    ])
                ]
            },
            {
                "subtitle": "Interview Readiness, Mock Rounds & Drive Day Strategy",
                "sections": [
                    ("Phase 3: Mock Drives & Fine-Tuning (Month 5)", [
                        "• Take 10 timed aptitude and coding tests simulating online assessment platforms.",
                        "• Conduct peer-to-peer technical and HR mock interviews using the STAR framework.",
                        "• Participate in campus group discussions on trending technology and socio-economic topics.",
                        "• Refine resume GitHub and deployed live project demonstration links."
                    ]),
                    ("Phase 4: Drive Execution & Mindset (Month 6)", [
                        "• Research recruiter job descriptions, eligibility criteria, and past interview archives.",
                        "• Rest adequately before drive days; maintain professional attire and backup devices.",
                        "• Treat every interview round as a collaborative engineering discussion."
                    ])
                ]
            }
        ]
    },
    {
        "file_name": "Verbal Ability Master Guide.pdf",
        "title": "Verbal Ability & Grammar Master Guide",
        "category": "Placement Preparation",
        "uploaded_by": "Verbal Training Department",
        "description": "Comprehensive verbal ability guide covering error spotting, subject-verb agreement, active/passive voice, idioms, and reading comprehension.",
        "pages": [
            {
                "subtitle": "Grammar Foundations: Subject-Verb Agreement & Error Spotting",
                "sections": [
                    ("1. Rules of Subject-Verb Agreement", [
                        "• Rule: Two singular subjects joined by 'and' require a plural verb (e.g. 'Rahul and Aman are best friends').",
                        "• Rule: Phrases like 'as well as', 'along with', 'accompanied by' do NOT compound subjects (e.g. 'The teacher, along with the students, is present').",
                        "• Rule: 'Neither... nor' and 'Either... or' take the verb agreeing with the closest subject (e.g. 'Neither the principal nor the teachers were willing to alter the schedule').",
                        "• Rule: Collective nouns take singular verbs when acting as a unified entity (e.g. 'The committee has submitted its report')."
                    ]),
                    ("2. High-Yield Error Spotting Rules", [
                        "• Inversion after negative adverbs: 'Under no circumstances should employees disclose confidential data.'",
                        "• Correlative conjunctions: 'Hardly had he entered... when the lights went out' / 'No sooner did she finish... than they clapped.'",
                        "• Redundancy: Avoid 'Despite of' (correct: 'Despite' or 'In spite of'); avoid 'more smarter' (correct: 'smarter').",
                        "• Parallelism: Elements in a series must share grammatical form (e.g. 'She likes reading, writing, and painting')."
                    ])
                ]
            },
            {
                "subtitle": "Voices, Speeches & Idiomatic Expressions",
                "sections": [
                    ("3. Active & Passive Voice Transformation", [
                        "• Simple Present: Active 'She writes a letter' -> Passive 'A letter is written by her.'",
                        "• Past Continuous: Active 'The students were decorating the room' -> Passive 'The room was being decorated by the students.'",
                        "• Modals: Active 'We must follow the rules' -> Passive 'The rules must be followed.'",
                        "• Future Perfect: Active 'They will have finished the work' -> Passive 'The work will have been finished by them.'"
                    ]),
                    ("4. Common Placement Idioms & Phrases", [
                        "• 'Break the ice': Initiate friendly conversation in an awkward situation.",
                        "• 'Burn the midnight oil': Study or work late into the night.",
                        "• 'Hit the nail on the head': State or diagnose something with exact precision.",
                        "• 'Blessing in disguise': A misfortune that eventually results in an unexpected positive outcome.",
                        "• 'Face the music': Accept unpleasant consequences of one's actions."
                    ])
                ]
            }
        ]
    }
]

def render_page(pdf, doc_title, category, subtitle, sections, page_num, total_pages):
    fig, ax = plt.subplots(figsize=(8.5, 11), dpi=150)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    # Header background strip
    header_box = patches.Rectangle((0, 92), 100, 8, facecolor="#1e293b", edgecolor="none")
    ax.add_patch(header_box)
    ax.text(5, 95.5, "CAMPUS RECRUITMENT SYSTEM", fontsize=11, color="#38bdf8", weight="bold")
    ax.text(95, 95.5, "REFERENCE LIBRARY", fontsize=10, color="#cbd5e1", weight="bold", ha="right")

    # Category badge
    cat_colors = {
        "Aptitude": "#0284c7",
        "Technical": "#7c3aed",
        "Programming": "#059669",
        "Resume": "#ea580c",
        "Group Discussion": "#d97706",
        "HR Interview": "#db2777",
        "Placement Preparation": "#2563eb"
    }
    badge_color = cat_colors.get(category, "#2563eb")
    badge = patches.FancyBboxPatch((5, 87), 24, 3.5, boxstyle="round,pad=0.3", facecolor=badge_color, edgecolor="none")
    ax.add_patch(badge)
    ax.text(17, 88.5, category.upper(), fontsize=8.5, color="white", weight="bold", ha="center")

    # Document Main Title & Subtitle
    ax.text(5, 83.5, doc_title, fontsize=15, color="#0f172a", weight="bold")
    ax.text(5, 80, subtitle, fontsize=10.5, color="#64748b", style="italic")
    
    # Divider line
    ax.plot([5, 95], [78, 78], color="#e2e8f0", linewidth=1.5)

    # Content Sections
    curr_y = 75
    for sec_title, lines in sections:
        ax.text(5, curr_y, sec_title, fontsize=11.5, color="#1e3a8a", weight="bold")
        curr_y -= 3.2
        for line in lines:
            # Word wrapping simulation
            ax.text(7, curr_y, line, fontsize=8.8, color="#334155")
            curr_y -= 2.6
        curr_y -= 2.5

    # Footer strip
    footer_box = patches.Rectangle((0, 0), 100, 4.5, facecolor="#f8fafc", edgecolor="#e2e8f0")
    ax.add_patch(footer_box)
    ax.text(5, 2, "Confidential - For Student Placement Preparation Only", fontsize=8, color="#94a3b8")
    ax.text(95, 2, f"Page {page_num} of {total_pages}", fontsize=8, color="#64748b", ha="right")

    pdf.savefig(fig, bbox_inches='tight')
    plt.close()

def main():
    print(f"Generating {len(DOCUMENTS)} reference PDF files in {OUTPUT_DIR}...")
    for idx, doc in enumerate(DOCUMENTS, 1):
        file_path = os.path.join(OUTPUT_DIR, doc["file_name"])
        total_pages = len(doc["pages"])
        with PdfPages(file_path) as pdf:
            for p_idx, page in enumerate(doc["pages"], 1):
                render_page(
                    pdf=pdf,
                    doc_title=doc["title"],
                    category=doc["category"],
                    subtitle=page["subtitle"],
                    sections=page["sections"],
                    page_num=p_idx,
                    total_pages=total_pages
                )
        file_size_kb = os.path.getsize(file_path) / 1024
        print(f"[{idx:02d}/{len(DOCUMENTS):02d}] Generated: {doc['file_name']} ({file_size_kb:.1f} KB, {total_pages} pages)")

if __name__ == "__main__":
    main()
