# Product Architecture Map

**Document status:** Living planning map  
**Last verified:** 2026-07-16
**Scope:** Milestone, release, and epic names, their approved planning relationships, and direct SDCB ticket counts

This is the first, repository-native version of the Product Architecture Map (PAM). It visualizes planning structure only; it does not claim that planned functionality is implemented. Ticket counts are point-in-time totals of the SDCB records directly linked through each epic's `Epic` relation. [`SYSTEM_STATUS.md`](SYSTEM_STATUS.md) remains authoritative for implementation status, and the Spartan Dev Command Board remains authoritative for live execution status and current counts.

## Milestone sequence

```mermaid
flowchart LR
    M06["v0.6 - Infrastructure / Foundation"] --> M07["v0.7 - Fireteam"]
    M07 --> M08["v0.8 - Command School"]
    M08 --> M09["v0.9 - Specialization School"]
    M09 --> M10["v1.0 - Live Operations"]

    classDef milestone fill:#14243a,stroke:#67e8f9,color:#f8fafc,stroke-width:2px;
    class M06,M07,M08,M09,M10 milestone;
```

## v0.6 - Infrastructure / Foundation

```mermaid
flowchart LR
    M06["v0.6 - Infrastructure / Foundation"]

    M06 --> R060["v0.6.0 - Foundation Lock"]
    M06 --> R061["v0.6.1 - Operational Workflow Completion"]
    M06 --> R062["v0.6.2 - Individual Progression Integrity"]

    R060 --> E060A["0.6.0 Campaign Event Reliability<br/>14 tickets"]
    R060 --> E060B["0.6.0 Security & Authorization<br/>1 ticket"]
    R060 --> E060C["0.6.0 Operational Time & Calendar Integrity<br/>3 tickets"]
    R060 --> E060D["0.6.0 Notion Data & Persistence Integrity<br/>3 tickets"]
    R060 --> E060E["0.6.0 Engineering Baseline & Governance<br/>10 tickets"]

    R061 --> E061A["0.6.1 Intelligence Reporting<br/>1 ticket"]
    R061 --> E061B["0.6.1 Academic Operations Core & SMU Reliability<br/>15 tickets"]
    R061 --> E061C["0.6.1 Daily & Weekly Operations Reliability<br/>4 tickets"]
    R061 --> E061D["📱 0.6.1 Cross-Surface Operational Consistency<br/>21 tickets"]
    R061 --> E061E["0.6.1 Training & Hydration Reporting<br/>5 tickets"]

    R062 --> E062A["0.6.2 Promotion Engine<br/>4 tickets"]
    R062 --> E062B["0.6.2 Readiness & XP Integrity<br/>6 tickets"]
    R062 --> E062C["0.6.2 Individual Completion & Fireteam Eligibility<br/>1 ticket"]
    R062 --> E062D["0.6.2 Achievement Engine Reliability<br/>7 tickets"]
    R062 --> E062E["0.6.2 Service History & Campaign Record<br/>4 tickets"]
    R062 --> E062F["0.6.2 Tier II Achievement Patches<br/>15 tickets"]

    classDef milestone fill:#14243a,stroke:#67e8f9,color:#f8fafc,stroke-width:2px;
    classDef release fill:#1e3a5f,stroke:#93c5fd,color:#f8fafc,stroke-width:1.5px;
    classDef epic fill:#172033,stroke:#94a3b8,color:#f8fafc;
    class M06 milestone;
    class R060,R061,R062 release;
    class E060A,E060B,E060C,E060D,E060E,E061A,E061B,E061C,E061D,E061E,E062A,E062B,E062C,E062D,E062E,E062F epic;
```

## v0.7 - Fireteam

```mermaid
flowchart LR
    M07["v0.7 - Fireteam"]

    M07 --> R070["v0.7.0 - Fireteam Assignment"]
    M07 --> R071["v0.7.1 - Unit Cohesion"]
    M07 --> R072["v0.7.2 - Field Exercises"]

    R070 --> E070A["0.7.0 Fireteam Assignment & Persistence<br/>3 tickets"]
    R070 --> E070B["0.7.0 Fireteam Identity & Dossiers<br/>6 tickets"]

    R071 --> E071A["0.7.1 Fireteam Relationship Progression<br/>4 tickets"]
    R071 --> E071B["0.7.1 Unit Cohesion Engine<br/>3 tickets"]

    R072 --> E072A["0.7.2 Field Exercise Progression<br/>5 tickets"]
    R072 --> E072B["0.7.2 Debriefs & Operational Readiness<br/>4 tickets"]

    classDef milestone fill:#14243a,stroke:#67e8f9,color:#f8fafc,stroke-width:2px;
    classDef release fill:#1e3a5f,stroke:#93c5fd,color:#f8fafc,stroke-width:1.5px;
    classDef epic fill:#172033,stroke:#94a3b8,color:#f8fafc;
    class M07 milestone;
    class R070,R071,R072 release;
    class E070A,E070B,E071A,E071B,E072A,E072B epic;
```

## v0.8 - Command School

```mermaid
flowchart LR
    M08["v0.8 - Command School"]

    M08 --> R080["v0.8.0 - Command Assignment"]
    M08 --> R081["v0.8.1 - Command Trust"]
    M08 --> R082["v0.8.2 - Battalion Command"]

    R080 --> E080A["0.8.0 Command Assignment & Identity<br/>4 tickets"]

    R081 --> E081A["0.8.1 Command Trust Progression<br/>4 tickets"]

    R082 --> E082A["0.8.2 Command School Qualification<br/>2 tickets"]
    R082 --> E082B["0.8.2 Battalion Command Operations<br/>5 tickets"]

    classDef milestone fill:#14243a,stroke:#67e8f9,color:#f8fafc,stroke-width:2px;
    classDef release fill:#1e3a5f,stroke:#93c5fd,color:#f8fafc,stroke-width:1.5px;
    classDef epic fill:#172033,stroke:#94a3b8,color:#f8fafc;
    class M08 milestone;
    class R080,R081,R082 release;
    class E080A,E081A,E082A,E082B epic;
```

## v0.9 - Specialization School

```mermaid
flowchart LR
    M09["v0.9 - Specialization School"]

    M09 --> R090["v0.9.0 - Specialization Assignment"]
    M09 --> R091["v0.9.1 - Specialization Curriculum"]
    M09 --> R092["v0.9.2 - Specialization Qualification"]

    R090 --> E090A["0.9.0 Specialization Assignment & Track Initialization<br/>6 tickets"]
    R091 --> E091A["0.9.1 Specialization Curriculum & Competency Evidence<br/>12 tickets"]
    R092 --> E092A["0.9.2 Specialization Evaluation & Qualification<br/>9 tickets"]

    classDef milestone fill:#14243a,stroke:#67e8f9,color:#f8fafc,stroke-width:2px;
    classDef release fill:#1e3a5f,stroke:#93c5fd,color:#f8fafc,stroke-width:1.5px;
    classDef epic fill:#172033,stroke:#94a3b8,color:#f8fafc;
    class M09 milestone;
    class R090,R091,R092 release;
    class E090A,E091A,E092A epic;
```

## v1.0 - Live Operations

```mermaid
flowchart LR
    M10["v1.0 - Live Operations"]

    M10 --> R100["v1.0.0 - Spartan Graduation"]
    M10 --> R101["v1.0.1 - Shield Systems"]
    M10 --> R102["v1.0.2 - Operational Campaigns"]
    M10 --> R103["v1.0.3 - Armory Progression"]

    R100 --> E100A["1.0.0 Graduation & Operational Identity<br/>4 tickets"]
    R100 --> E100B["1.0.0 Armor Issuance & Base Armory<br/>3 tickets"]

    R101 --> E101A["1.0.1 Emergency Shield Recovery<br/>4 tickets"]
    R101 --> E101B["1.0.1 Shield State & Damage Engine<br/>3 tickets"]

    R102 --> E102A["1.0.2 Live Operations Campaign Engine<br/>2 tickets"]
    R102 --> E102B["1.0.2 Operational Checkpoints & Branching<br/>3 tickets"]
    R102 --> E102C["1.0.2 Mission Intel & Checkpoint Briefings<br/>5 tickets"]

    R103 --> E103A["1.0.3 Armor & Shield Upgrades<br/>2 tickets"]
    R103 --> E103B["1.0.3 Armory Skill Tree & Economy<br/>6 tickets"]

    classDef milestone fill:#14243a,stroke:#67e8f9,color:#f8fafc,stroke-width:2px;
    classDef release fill:#1e3a5f,stroke:#93c5fd,color:#f8fafc,stroke-width:1.5px;
    classDef epic fill:#172033,stroke:#94a3b8,color:#f8fafc;
    class M10 milestone;
    class R100,R101,R102,R103 release;
    class E100A,E100B,E101A,E101B,E102A,E102B,E102C,E103A,E103B epic;
```

## Sources

- [`ROADMAP.md`](ROADMAP.md) — approved milestone and release architecture.
- [`ADR-0004`](adr/0004-progression-engine-roadmap-structure.md) — planning hierarchy and canonical milestone sequence.
- Release Operations and the Spartan Dev Command Board — names, parent relations, and direct epic ticket counts verified on 2026-07-16.
