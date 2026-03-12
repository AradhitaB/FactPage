// ─────────────────────────────────────────────────────────────────────────────
// EDIT THIS FILE to change the list content.
//
// Add, remove, or reorder items freely — both list variants (scrollable and
// click-through) adapt automatically to however many items are here.
//
// Each item needs:
//   title  — short heading shown in bold
//   body   — the paragraph text beneath it
// ─────────────────────────────────────────────────────────────────────────────

export interface ListItem {
  id: number
  title: string
  body: string
}

export const LIST_ITEMS: ListItem[] = [
  {
    id: 1,
    title: 'Lorem ipsum dolor sit amet',
    body: 'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
  {
    id: 2,
    title: 'Duis aute irure dolor',
    body: 'In reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    id: 3,
    title: 'Sed ut perspiciatis unde',
    body: 'Omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  },
  {
    id: 4,
    title: 'Nemo enim ipsam voluptatem',
    body: 'Quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est qui dolorem ipsum quia dolor sit.',
  },
  {
    id: 5,
    title: 'Ut labore et dolore magnam',
    body: 'Aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur quis autem vel eum.',
  },
  {
    id: 6,
    title: 'Quis autem vel eum iure',
    body: 'Reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur at vero eos et accusamus et iusto odio.',
  },
  {
    id: 7,
    title: 'Nam libero tempore cum soluta',
    body: 'Nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus temporibus autem quibusdam.',
  },
  {
    id: 8,
    title: 'Itaque earum rerum hic tenetur',
    body: 'A sapiente delectus ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat et harum quidem rerum facilis est et expedita distinctio.',
  },
]
