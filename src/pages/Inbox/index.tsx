import React from 'react';
import MailList from './components/mail-list';
import Nav from './components/nav';
import SingleRequestLayout from './components/single-request';

const Inbox = () => {
  return (
    <React.Fragment>
      <Nav />
      <main className="xl:grid grid-cols-3 gap-1">
        <section className="col-span-1">
          <MailList />
        </section>
        <section className="py-2 border-l-2 border-t-2 border-r-2 border-muted dark:border-secondary/40 rounded-lg col-span-2">
        <SingleRequestLayout/>
        </section>
      </main>
    </React.Fragment>
  );
};

export default Inbox;
