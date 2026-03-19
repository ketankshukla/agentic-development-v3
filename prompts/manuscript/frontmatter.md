# Frontmatter Generation Prompt

You are generating the frontmatter files for a cinematic action fiction novel.

## Input

**Title:** {{TITLE}}
**Author:** {{AUTHOR}}
**Publisher:** {{PUBLISHER}}
**Year:** {{YEAR}}

**Book Plan:**
{{PLAN}}

## Instructions

Generate the following 4 files:

### 1. Opening Credits (00-opening-credits.md)
Plain text only. No markdown headings. No horizontal rules.
This plays at the start of the audiobook.

Format exactly:
```
{{PUBLISHER}} presents...

{{TITLE}}

Written by {{AUTHOR}}
```

### 2. Copyright (01-copyright.md)
Standard markdown with heading.

Format exactly:
```
# Copyright

Copyright {{YEAR}} {{AUTHOR}}

All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the publisher, except in the case of brief quotations in critical reviews and certain other noncommercial uses permitted by copyright law.

This is a work of fiction. Names, characters, places, events, and incidents are either products of the author's imagination or used fictitiously. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.

Published by {{PUBLISHER}}
```

### 3. Dedication (02-dedication.md)
Two evocative thematic lines derived from the book's themes and characters.
Never from personal relationships. Always tied to the story.

Example format:
```
# Dedication

For those who face the storm when others run.
For those who carry fire in the dark.
```

### 4. Prologue (03-prologue.md)
Standard markdown with heading. 800-1200 words.

The prologue should:
- Set the tone and stakes
- May be a scene from the antagonist's POV
- Or a moment from the protagonist's past
- Or an in-media-res opening that hooks immediately
- Must connect thematically to the main story

## Output Format

Wrap each file in FILE tags:

<FILE:00-opening-credits.md>
[content]
</FILE>

<FILE:01-copyright.md>
[content]
</FILE>

<FILE:02-dedication.md>
[content]
</FILE>

<FILE:03-prologue.md>
[content]
</FILE>
